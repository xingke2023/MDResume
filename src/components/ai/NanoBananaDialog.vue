<script setup lang="ts">
import { Gem, ImagePlus, Send } from 'lucide-vue-next'
import { ref } from 'vue'
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

// 表单数据
const prompt = ref('')
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const isProcessing = ref(false)

// 文件输入引用
const fileInput = ref<HTMLInputElement | null>(null)

function closeDialog() {
  emit('update:visible', false)
  // 重置表单
  prompt.value = ''
  imageFiles.value = []
  imagePreviews.value = []
}

// 选择图片
function selectImage() {
  fileInput.value?.click()
}

// 处理图片选择（支持多选）
function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) {
    return
  }

  // 验证并添加每个文件
  Array.from(files).forEach((file) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} 不是图片文件`)
      return
    }

    // 验证文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} 大小超过10MB`)
      return
    }

    // 添加文件
    imageFiles.value.push(file)

    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreviews.value.push(e.target?.result as string)
    }
    reader.onerror = () => {
      toast.error(`读取 ${file.name} 失败`)
    }
    reader.readAsDataURL(file)
  })

  // 清空input，允许重复选择同一文件
  input.value = ''
}

// 移除指定索引的图片
function removeImage(index: number) {
  imageFiles.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

// 发送请求
async function handleSubmit() {
  if (!prompt.value.trim()) {
    toast.error('请输入提示词')
    return
  }

  isProcessing.value = true

  try {
    // 构建 FormData
    const formData = new FormData()
    formData.append('prompt', prompt.value.trim())

    // 如果有图片，添加到 FormData（支持多张）
    if (imageFiles.value.length > 0) {
      imageFiles.value.forEach((file) => {
        formData.append('images', file)
      })
    }

    // 构建请求
    const API_URL = 'https://wechat.easy-write.com/api/image/generate-wechat'
    const API_KEY = '0dbe66d87befa7a9d5d7c1bdbc631a9b7dc5ce88be9a20e41c26790060802647'

    const headers: Record<string, string> = {
      'X-API-Key': API_KEY,
      // 不设置 Content-Type，让浏览器自动设置 multipart/form-data 的 boundary
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI接口错误详情:', errorText)
      throw new Error(`AI 接口请求失败 (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Nano Banana 处理失败')
    }

    const wechatUrl = data.data?.wechatImageUrl

    if (!wechatUrl) {
      console.error('AI响应数据:', data)
      throw new Error('未返回微信图片URL')
    }

    // 显示成功并插入图片
    toast.success('Nano Banana 处理完成！')
    console.log('微信图片URL:', wechatUrl)

    // 将图片插入到编辑器
    await insertImageToEditor(wechatUrl, data.data?.prompt || prompt.value)

    // 关闭对话框
    closeDialog()
  }
  catch (error) {
    console.error('Nano Banana 处理失败:', error)

    let errorMessage = '处理失败'
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('CORS') || errorMsg.includes('cross-origin')) {
      errorMessage = 'CORS跨域错误：请确保AI接口支持跨域访问，或使用代理服务'
    }
    else if (errorMsg.includes('401')) {
      errorMessage = 'API密钥验证失败，请检查密钥配置'
    }
    else if (errorMsg.includes('429')) {
      errorMessage = 'API调用频率超限，请稍后重试'
    }
    else if (errorMsg.includes('403')) {
      errorMessage = 'API访问被拒绝，请检查密钥权限'
    }
    else if (errorMsg.includes('404')) {
      errorMessage = 'API接口地址错误，请检查endpoint配置'
    }
    else {
      errorMessage = `处理失败: ${errorMsg}`
    }

    toast.error(errorMessage)
  }
  finally {
    isProcessing.value = false
  }
}

// 插入图片到编辑器
async function insertImageToEditor(imageUrl: string, imagePrompt: string) {
  if (!store.editor) {
    console.warn('编辑器未初始化')
    toast.error('编辑器未初始化')
    return
  }

  try {
    // 生成简洁的alt文本
    const altText = imagePrompt.trim()
      ? imagePrompt.trim().substring(0, 30).replace(/\n/g, ' ')
      : 'Nano Banana 生成的图片'

    // 生成Markdown图片语法
    const markdownImage = `![${altText}](${imageUrl})`

    // 获取当前光标位置并插入
    const cursor = store.editor.getCursor()
    store.editor.replaceRange(markdownImage, cursor)

    // 将光标移动到插入内容后面
    const newCursor = { line: cursor.line, ch: cursor.ch + markdownImage.length }
    store.editor.setCursor(newCursor)

    // 聚焦编辑器
    store.editor.focus()

    toast.success('图片已插入编辑器')
    console.log('✅ 图片已成功插入到编辑器')
  }
  catch (error) {
    const errorMsg = (error as Error).message || '插入图片失败'
    toast.error(errorMsg)
    console.error('❌ 插入图片到编辑器失败:', error)
  }
}
</script>

<template>
  <!-- Nano Banana 对话框 -->
  <div
    v-if="visible"
    class="backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click="closeDialog"
  >
    <div
      class="mx-4 max-w-2xl w-[90vw] scale-100 transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 标题图标 -->
      <div class="mb-4 flex items-center justify-center">
        <div class="bg-gradient-to-r from-purple-500 to-pink-600 h-12 w-12 flex items-center justify-center rounded-full">
          <Gem class="h-6 w-6 text-white" />
        </div>
      </div>

      <!-- 标题 -->
      <h3 class="mb-2 text-center text-xl text-gray-900 font-bold dark:text-gray-100">
        Nano Banana
      </h3>

      <!-- 描述 -->
      <p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        使用 Google 最新的图片模型，可以单独发送文字，或者发送图片加文字进行分析
      </p>

      <!-- 表单内容 -->
      <div class="space-y-4">
        <!-- 图片上传区域 -->
        <div>
          <label class="mb-2 block text-sm text-gray-700 font-medium dark:text-gray-300">
            上传图片 <span class="text-gray-500 text-xs">(可选)</span>
          </label>

          <!-- 上传区域 -->
          <div
            v-if="imagePreviews.length === 0"
            class="border-2 border-gray-300 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500"
            @click="selectImage"
          >
            <ImagePlus class="mx-auto mb-2 h-12 w-12 text-gray-400" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              点击选择图片（可多选）
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
              支持 JPG、PNG、GIF 等格式，单个文件最大 10MB
            </p>
          </div>

          <!-- 图片预览网格 -->
          <div v-else class="space-y-3">
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div
                v-for="(preview, index) in imagePreviews"
                :key="index"
                class="group relative aspect-square overflow-hidden border-2 border-gray-300 rounded-lg dark:border-gray-600"
              >
                <img
                  :src="preview"
                  :alt="`预览图片 ${index + 1}`"
                  class="h-full w-full object-cover"
                >
                <button
                  class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1.5 text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
                  @click="removeImage(index)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- 添加更多图片按钮 -->
            <button
              type="button"
              class="w-full border-2 border-gray-300 border-dashed rounded-lg p-3 text-center text-sm text-gray-600 transition-colors dark:border-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-400"
              @click="selectImage"
            >
              <ImagePlus class="mx-auto mb-1 h-5 w-5" />
              添加更多图片
            </button>
          </div>
        </div>

        <!-- 提示词输入 -->
        <div>
          <label class="mb-2 block text-sm text-gray-700 font-medium dark:text-gray-300">
            提示词 <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="prompt"
            rows="4"
            placeholder="请描述您想让 AI 对这张图片做什么分析或处理..."
            class="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 transition-colors dark:border-gray-600 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:placeholder:text-gray-500"
          />
        </div>

        <!-- 提示信息 -->
        <div class="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
          <p class="text-sm text-purple-800 dark:text-purple-300">
            <span class="font-medium">💡 提示：</span>Nano Banana 支持纯文本生成图片，也支持上传图片进行理解、物体识别、场景分析等多种功能
          </p>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          class="flex-1"
          :disabled="isProcessing"
          @click="closeDialog"
        >
          取消
        </Button>
        <Button
          class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 flex-1 border-0 text-white"
          :disabled="isProcessing || !prompt.trim()"
          @click="handleSubmit"
        >
          <Send v-if="!isProcessing" class="mr-1 h-4 w-4" />
          <div v-if="isProcessing" class="animate-spin mr-1 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          {{ isProcessing ? '处理中...' : '发送' }}
        </Button>
      </div>
    </div>
  </div>

  <!-- 隐藏的文件选择输入框（支持多选） -->
  <input
    ref="fileInput"
    type="file"
    accept="image/*"
    multiple
    class="hidden"
    @change="handleImageChange"
  >
</template>
