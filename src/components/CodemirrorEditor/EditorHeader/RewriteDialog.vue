<script setup lang="ts">
import { Wand2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { ref, toRaw } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { useStore } from '@/stores'
import useAIConfigStore from '@/stores/AIConfig'

const store = useStore()
const aiConfigStore = useAIConfigStore()
const { editor } = storeToRefs(store)

// 对话框可见性
const visible = defineModel<boolean>(`visible`, { required: true })

// 一键改写状态
const isRewriting = ref(false)
const rewriteRequirement = ref(``)

// 显示对话框
function show() {
  if (!editor.value)
    return

  const content = editor.value.getValue()
  if (!content.trim()) {
    toast.error(`编辑器内容为空，无法改写`)
    return
  }

  rewriteRequirement.value = ``
  visible.value = true
}

// 一键改写功能
async function rewriteContent() {
  if (!editor.value || isRewriting.value)
    return

  const content = editor.value.getValue()
  if (!content.trim()) {
    toast.error(`编辑器内容为空`)
    return
  }

  const requirement = rewriteRequirement.value.trim()
  if (!requirement) {
    toast.error(`请输入改写要求`)
    return
  }

  isRewriting.value = true

  try {
    const { apiKey, model, endpoint, temperature, type } = aiConfigStore

    // 检查基本配置
    if (!endpoint) {
      toast.error(`请先配置 AI 接口地址`)
      return
    }

    if (!model) {
      toast.error(`请先选择 AI 模型`)
      return
    }

    // 只有非默认服务才需要验证API密钥
    if (type !== `default` && (!apiKey || apiKey === `your-api-key-here`)) {
      toast.error(`请先配置 AI 接口密钥`)
      return
    }

    // 系统提示词
    const systemPrompt = `你是一个专业的文案改写助手。请根据用户的改写要求，对提供的文章内容进行改写。

改写要求：
1. 直接输出改写后的 Markdown 源码，不要包含 \`\`\`markdown 或任何代码块标记
2. 严格按照用户的改写要求进行改写
3. 保持原文的核心信息和关键点
4. 确保改写后的内容流畅、连贯、易读
5. 保持 Markdown 格式的规范性
6. 如果用户要求改变风格、语气或专业度，请相应调整
7. 保留原文中的重要数据、引用和事实`

    // 用户提示词
    const userPrompt = `请根据以下改写要求，对原文进行改写：

【改写要求】
${requirement}

【原文内容】
${content}

请直接输出改写后的内容，不要添加任何额外说明。`

    // 构建正确的API URL
    const url = new URL(endpoint)
    // 对于星科代理的 DeepSeek API，endpoint 已经包含完整路径
    if (!(type === `deepseek` && endpoint.includes(`xingke888.com`))) {
      if (!url.pathname.endsWith(`/chat/completions`))
        url.pathname = url.pathname.replace(/\/?$/, `/chat/completions`)
    }
    else {
      // 星科代理需要添加 /chat 路径
      if (!url.pathname.endsWith(`/chat`))
        url.pathname = url.pathname.replace(/\/?$/, `/chat`)
    }

    const headers: Record<string, string> = {
      'Content-Type': `application/json`,
    }

    // 只有非默认服务才需要API密钥
    if (apiKey && type !== `default`) {
      // 对于 DeepSeek 使用星科代理的情况，使用 X-API-Key
      if (type === `deepseek` && endpoint.includes(`xingke888.com`)) {
        headers[`X-API-Key`] = apiKey
      }
      else {
        headers.Authorization = `Bearer ${apiKey}`
      }
    }

    const response = await fetch(url.toString(), {
      method: `POST`,
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: `system`, content: systemPrompt },
          { role: `user`, content: userPrompt },
        ],
        temperature: temperature || 0.7,
        max_tokens: aiConfigStore.maxToken || 8192,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`AI接口错误详情:`, errorText)
      throw new Error(`AI 接口请求失败 (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()
    let rewrittenContent = ``

    // 处理星科代理的包装格式
    if (type === `deepseek` && endpoint.includes(`xingke888.com`)) {
      if (data.success && data.data) {
        rewrittenContent = data.data.message || data.data.raw?.choices?.[0]?.message?.content || ``
      }
      else {
        throw new Error(data.message || `API 调用失败`)
      }
    }
    else {
      // 标准 OpenAI 格式
      rewrittenContent = data.choices?.[0]?.message?.content || ``
    }

    if (!rewrittenContent) {
      console.error(`AI响应数据:`, data)
      throw new Error(`AI 返回内容为空，请检查API配置`)
    }

    // 追加到编辑器末尾，添加分隔符
    const currentContent = toRaw(editor.value).getValue()
    const separator = `\n\n---\n\n## 改写版本\n\n`
    const newContent = currentContent + separator + rewrittenContent

    toRaw(editor.value).setValue(newContent)

    // 滚动到改写内容位置
    const lineCount = toRaw(editor.value).lineCount()
    toRaw(editor.value).scrollIntoView({ line: lineCount - 1, ch: 0 })

    toast.success(`改写完成！内容已追加到原文后面`)
    visible.value = false
  }
  catch (error) {
    console.error(`改写失败:`, error)

    // 提供更友好的错误提示
    let errorMessage = `改写失败`
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes(`Failed to fetch`) || errorMsg.includes(`CORS`) || errorMsg.includes(`cross-origin`)) {
      errorMessage = `CORS跨域错误：请确保AI接口支持跨域访问，或使用代理服务`
    }
    else if (errorMsg.includes(`401`)) {
      errorMessage = `API密钥验证失败，请检查密钥配置`
    }
    else if (errorMsg.includes(`429`)) {
      errorMessage = `API调用频率超限，请稍后重试`
    }
    else if (errorMsg.includes(`403`)) {
      errorMessage = `API访问被拒绝，请检查密钥权限`
    }
    else if (errorMsg.includes(`404`)) {
      errorMessage = `API接口地址错误，请检查endpoint配置`
    }
    else {
      errorMessage = `改写失败: ${errorMsg}`
    }

    toast.error(errorMessage)
  }
  finally {
    isRewriting.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  show,
})
</script>

<template>
  <!-- 一键改写对话框 -->
  <div
    v-if="visible"
    class="backdrop-blur-sm fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
    @click="visible = false"
  >
    <div
      class="mx-4 max-w-lg w-[90vw] scale-100 transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 标题图标 -->
      <div class="mb-4 flex items-center justify-center">
        <div class="bg-gradient-to-r from-purple-500 to-pink-600 h-12 w-12 flex items-center justify-center rounded-full">
          <Wand2 class="h-6 w-6 text-white" />
        </div>
      </div>

      <!-- 标题 -->
      <h3 class="mb-2 text-center text-xl text-gray-900 font-bold dark:text-gray-100">
        AI 智能改写
      </h3>

      <!-- 描述 -->
      <p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        输入改写要求，AI 将根据要求改写当前文档内容
      </p>

      <!-- 输入框 -->
      <div class="mb-4">
        <label class="mb-2 block text-sm text-gray-700 font-medium dark:text-gray-300">
          改写要求
        </label>
        <textarea
          v-model="rewriteRequirement"
          placeholder="例如：将这篇文章改写得更专业、更简洁，适合技术博客发布..."
          rows="4"
          class="dark:placeholder-gray-400 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 transition-colors dark:border-gray-600 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <!-- 提示信息 -->
      <div class="mb-6 rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
        <p class="text-sm text-purple-800 dark:text-purple-300">
          <span class="font-medium">💡 提示：</span>改写后的内容将追加到原文后面，不会覆盖原文
        </p>
      </div>

      <!-- 按钮组 -->
      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          class="flex-1"
          :disabled="isRewriting"
          @click="visible = false"
        >
          取消
        </Button>
        <Button
          class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 flex-1 border-0 text-white"
          :disabled="isRewriting || !rewriteRequirement.trim()"
          @click="rewriteContent()"
        >
          <Wand2 v-if="!isRewriting" class="mr-1 h-4 w-4" />
          <div v-if="isRewriting" class="animate-spin mr-1 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          {{ isRewriting ? '改写中...' : '开始改写' }}
        </Button>
      </div>
    </div>
  </div>
</template>
