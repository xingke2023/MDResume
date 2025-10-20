<script setup lang="ts">
import { Wrench } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { useStore } from '@/stores'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const store = useStore()

// 抓取工具状态
const isFetching = ref(false)
const fetchUrl = ref(``)
const fetchUrlInput = ref<HTMLInputElement | null>(null)

// 监听对话框打开，重置URL
watch(() => emit, () => {
  fetchUrl.value = ``
})

function closeDialog() {
  emit(`update:visible`, false)
}

// 抓取公众号文章
async function fetchArticle() {
  if (!store.editor || isFetching.value)
    return

  const url = fetchUrl.value.trim()
  if (!url) {
    toast.error(`请输入公众号文章链接`)
    return
  }

  // 简单的URL验证
  if (!url.startsWith(`http://`) && !url.startsWith(`https://`)) {
    toast.error(`请输入有效的网址`)
    return
  }

  isFetching.value = true

  try {
    // 开发环境使用代理，生产环境直接访问
    const apiEndpoint = import.meta.env.DEV
      ? `/api/extract`
      : `https://api.xingke888.com/extract/api/extract`

    const response = await fetch(apiEndpoint, {
      method: `POST`,
      headers: {
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({
        url,
        format: `text`,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`抓取接口错误详情:`, errorText)
      throw new Error(`抓取失败 (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()

    // 检查响应是否成功
    if (!data.success) {
      throw new Error(`抓取失败: ${data.message || `未知错误`}`)
    }

    // 根据format参数获取对应的内容字段
    // format为html时从content_html获取，为text时从content_text获取
    const content = data.data?.content_html || data.data?.content_text || data.content || data.text || data.markdown

    if (!content) {
      console.error(`API响应数据:`, data)
      throw new Error(`API 返回内容为空`)
    }

    // 替换编辑器内容
    store.editor.setValue(content)
    toast.success(`文章抓取成功！内容已导入编辑器`)
    closeDialog()
  }
  catch (error) {
    console.error(`抓取文章失败:`, error)

    // 提供更友好的错误提示
    let errorMessage = `抓取文章失败`
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes(`Failed to fetch`) || errorMsg.includes(`CORS`) || errorMsg.includes(`cross-origin`)) {
      errorMessage = `CORS跨域错误：请确保抓取接口支持跨域访问`
    }
    else if (errorMsg.includes(`401`)) {
      errorMessage = `API密钥验证失败，请检查配置`
    }
    else if (errorMsg.includes(`429`)) {
      errorMessage = `API调用频率超限，请稍后重试`
    }
    else if (errorMsg.includes(`403`)) {
      errorMessage = `API访问被拒绝，请检查权限`
    }
    else if (errorMsg.includes(`404`)) {
      errorMessage = `API接口地址错误，请检查配置`
    }
    else {
      errorMessage = `抓取文章失败: ${errorMsg}`
    }

    toast.error(errorMessage)
  }
  finally {
    isFetching.value = false
  }
}
</script>

<template>
  <!-- 抓取工具对话框 -->
  <div
    v-if="visible"
    class="backdrop-blur-sm fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
    @click="closeDialog"
  >
    <div
      class="mx-4 max-w-lg w-[90vw] scale-100 transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 标题图标 -->
      <div class="mb-4 flex items-center justify-center">
        <div class="bg-gradient-to-r to-blue-600 from-green-500 h-12 w-12 flex items-center justify-center rounded-full">
          <Wrench class="h-6 w-6 text-white" />
        </div>
      </div>

      <!-- 标题 -->
      <h3 class="mb-2 text-center text-xl text-gray-900 font-bold dark:text-gray-100">
        抓取公众号文章
      </h3>

      <!-- 描述 -->
      <p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        输入公众号文章链接，自动提取内容到编辑器
      </p>

      <!-- 输入框 -->
      <div class="mb-4">
        <label class="mb-2 block text-sm text-gray-700 font-medium dark:text-gray-300">
          文章链接
        </label>
        <input
          ref="fetchUrlInput"
          v-model="fetchUrl"
          type="url"
          autofocus
          placeholder="https://mp.weixin.qq.com/s/..."
          class="dark:placeholder-gray-400 w-full border border-gray-300 rounded-lg px-4 py-1.5 text-gray-900 transition-colors dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="fetchArticle()"
        >
      </div>

      <!-- 提示信息 -->
      <div class="mb-6 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <span class="font-medium">💡 提示：</span>支持微信公众号文章链接，提取后将覆盖当前编辑器内容
        </p>
      </div>

      <!-- 按钮组 -->
      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          class="flex-1"
          :disabled="isFetching"
          @click="closeDialog"
        >
          取消
        </Button>
        <Button
          class="bg-gradient-to-r from-green-500 to-blue-600 hover:to-blue-700 hover:from-green-600 flex-1 border-0 text-white"
          :disabled="isFetching || !fetchUrl.trim()"
          @click="fetchArticle()"
        >
          <Wrench v-if="!isFetching" class="mr-1 h-4 w-4" />
          <div v-if="isFetching" class="animate-spin mr-1 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          {{ isFetching ? '抓取中...' : '开始抓取' }}
        </Button>
      </div>
    </div>
  </div>
</template>
