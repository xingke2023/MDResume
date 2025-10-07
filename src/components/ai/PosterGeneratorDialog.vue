<script setup lang="ts">
import {
  Copy,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
  Trash2,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/stores'
import useAIImageConfigStore from '@/stores/AIImageConfig'
import { copyPlain } from '@/utils/clipboard'

/* ---------- 组件属性 ---------- */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits([`update:open`])

/* ---------- 编辑器引用 ---------- */
const store = useStore()
const { editor } = storeToRefs(store)

/* ---------- AI 配置 ---------- */
const AIImageConfigStore = useAIImageConfigStore()
const { endpoint } = storeToRefs(AIImageConfigStore)

/* ---------- 弹窗开关 ---------- */
const dialogVisible = ref(props.open)
watch(() => props.open, (val) => {
  dialogVisible.value = val
  // 每次打开面板时检查并清理过期图片
  if (val) {
    cleanExpiredImages()
    // 强制设置服务商为人工智能写作
    if (AIImageConfigStore.type !== `aiwriting`) {
      AIImageConfigStore.type = `aiwriting`
      AIImageConfigStore.endpoint = `https://wechat.easy-write.com/extract/api/generate_image`
      AIImageConfigStore.model = ``
    }
  }
})
watch(dialogVisible, val => emit(`update:open`, val))

/* ---------- 状态管理 ---------- */
const loading = ref(false)
const loadingProgress = ref(0) // 加载进度 (0-100)
const prompt = ref<string>(``)
const lastUsedPrompt = ref<string>(``) // 存储最后一次使用的提示词，用于重新生成
const generatedImages = ref<string[]>([])
const imagePrompts = ref<string[]>([]) // 存储每张图片对应的prompt
const imageTimestamps = ref<number[]>([]) // 存储每张图片的生成时间戳
const abortController = ref<AbortController | null>(null)
const currentImageIndex = ref(0)
const timeUpdateInterval = ref<NodeJS.Timeout | null>(null)
const selectedStyle = ref<string>(``)

/* ---------- 预设风格模板 ---------- */
interface StyleTemplate {
  id: string
  name: string
  emoji: string
  description: string
  template: string
  placeholder: string
}

const styleTemplates: StyleTemplate[] = [
  {
    id: `cartoon`,
    name: `卡通风格`,
    emoji: `🎨`,
    description: `可爱活泼的卡通插画风格`,
    template: `卡通风格海报，可爱活泼，色彩鲜艳，{content}，扁平化设计，矢量插画风格`,
    placeholder: `输入海报主题，如：夏日促销活动`,
  },
  {
    id: `realistic`,
    name: `写实风格`,
    emoji: `📷`,
    description: `高清真实的摄影级效果`,
    template: `写实风格海报，高清摄影，真实质感，{content}，专业摄影级别，光影细腻`,
    placeholder: `输入海报主题，如：咖啡店开业`,
  },
  {
    id: `minimalist`,
    name: `极简风格`,
    emoji: `⚪`,
    description: `简约现代的设计风格`,
    template: `极简风格海报，简约现代，留白设计，{content}，几何元素，高级感`,
    placeholder: `输入海报主题，如：产品发布会`,
  },
  {
    id: `vintage`,
    name: `复古风格`,
    emoji: `📻`,
    description: `怀旧复古的艺术风格`,
    template: `复古风格海报，怀旧质感，复古色调，{content}，老式海报设计，年代感`,
    placeholder: `输入海报主题，如：音乐节活动`,
  },
  {
    id: `tech`,
    name: `科技风格`,
    emoji: `🚀`,
    description: `未来感十足的科技风`,
    template: `科技风格海报，未来感，科技元素，{content}，蓝色调，数字化设计，科幻感`,
    placeholder: `输入海报主题，如：AI新品发布`,
  },
  {
    id: `chinese`,
    name: `中国风`,
    emoji: `🏮`,
    description: `传统典雅的中式风格`,
    template: `中国风海报，传统元素，水墨画风格，{content}，典雅大气，中式美学`,
    placeholder: `输入海报主题，如：茶文化展览`,
  },
]

/* ---------- 过期检查函数 ---------- */
function isImageExpired(timestamp: number): boolean {
  const EXPIRY_TIME = 60 * 60 * 1000 // 1小时，单位毫秒
  const now = Date.now()
  return now - timestamp > EXPIRY_TIME
}

function cleanExpiredImages() {
  const savedImages = localStorage.getItem(`poster_generated_images`)
  const savedPrompts = localStorage.getItem(`poster_image_prompts`)
  const savedTimestamps = localStorage.getItem(`poster_image_timestamps`)

  if (!savedImages) {
    return
  }

  const images = JSON.parse(savedImages)
  const prompts = savedPrompts ? JSON.parse(savedPrompts) : []
  const timestamps = savedTimestamps ? JSON.parse(savedTimestamps) : []

  // 如果没有时间戳数据，说明是旧版本，默认清除所有数据
  if (!savedTimestamps || timestamps.length === 0) {
    console.log(`🧹 检测到旧版本数据，清除所有过期图片`)
    generatedImages.value = []
    imagePrompts.value = []
    imageTimestamps.value = []
    localStorage.removeItem(`poster_generated_images`)
    localStorage.removeItem(`poster_image_prompts`)
    localStorage.removeItem(`poster_image_timestamps`)
    return
  }

  // 过滤掉过期的图片
  const validIndices: number[] = []
  timestamps.forEach((timestamp: number, index: number) => {
    if (!isImageExpired(timestamp)) {
      validIndices.push(index)
    }
  })

  const validImages = validIndices.map(i => images[i]).filter(Boolean)
  const validPrompts = validIndices.map(i => prompts[i] || ``).filter((_, index) => validImages[index])
  const validTimestamps = validIndices.map(i => timestamps[i]).filter(Boolean)

  // 更新数据
  generatedImages.value = validImages
  imagePrompts.value = validPrompts
  imageTimestamps.value = validTimestamps

  // 如果有数据被清除，更新localStorage
  if (validImages.length < images.length) {
    console.log(`🧹 清除了 ${images.length - validImages.length} 张过期图片`)
    if (validImages.length > 0) {
      localStorage.setItem(`poster_generated_images`, JSON.stringify(validImages))
      localStorage.setItem(`poster_image_prompts`, JSON.stringify(validPrompts))
      localStorage.setItem(`poster_image_timestamps`, JSON.stringify(validTimestamps))
    }
    else {
      localStorage.removeItem(`poster_generated_images`)
      localStorage.removeItem(`poster_image_prompts`)
      localStorage.removeItem(`poster_image_timestamps`)
    }
  }

  console.log(`📊 过期检查完成，有效图片数量:`, validImages.length)
}

/* ---------- 初始数据 ---------- */
onMounted(() => {
  // 先进行过期检查和清理
  cleanExpiredImages()

  // 确保数组长度一致
  const imagesLength = generatedImages.value.length
  const promptsLength = imagePrompts.value.length
  const timestampsLength = imageTimestamps.value.length

  const maxLength = Math.max(imagesLength, promptsLength, timestampsLength)

  if (imagesLength < maxLength) {
    // 如果图片少于其他数组，说明数据不一致，清除所有数据
    console.warn(`⚠️ 数据不一致，清除所有数据`)
    generatedImages.value = []
    imagePrompts.value = []
    imageTimestamps.value = []
    localStorage.removeItem(`poster_generated_images`)
    localStorage.removeItem(`poster_image_prompts`)
    localStorage.removeItem(`poster_image_timestamps`)
  }
  else {
    // 补齐较短的数组
    if (promptsLength < imagesLength) {
      imagePrompts.value = [...imagePrompts.value, ...Array.from({ length: imagesLength - promptsLength }, () => ``)]
    }
    if (timestampsLength < imagesLength) {
      imageTimestamps.value = [...imageTimestamps.value, ...Array.from({ length: imagesLength - timestampsLength }, () => Date.now())]
    }
  }

  console.log(`📊 数据加载完成，图片数量:`, generatedImages.value.length, `提示词数量:`, imagePrompts.value.length, `时间戳数量:`, imageTimestamps.value.length)

  // 启动定时器，每30秒检查一次过期图片并更新时间显示
  timeUpdateInterval.value = setInterval(() => {
    // 检查并清理过期图片
    if (generatedImages.value.length > 0) {
      cleanExpiredImages()
    }
  }, 30000) // 30秒
})

onBeforeUnmount(() => {
  // 清除定时器
  if (timeUpdateInterval.value) {
    clearInterval(timeUpdateInterval.value)
    timeUpdateInterval.value = null
  }
})

/* ---------- 事件处理 ---------- */
function handleKeydown(e: KeyboardEvent) {
  if (e.isComposing)
    return

  if (e.key === `Enter` && !e.shiftKey) {
    e.preventDefault()
    generateImage()
  }
}

/* ---------- 轮询任务状态 ---------- */
async function pollTaskStatus(taskId: string): Promise<string | null> {
  const maxAttempts = 60 // 最多轮询60次
  const pollInterval = 2000 // 每2秒轮询一次

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // 检查是否被取消
      if (abortController.value?.signal.aborted) {
        throw new Error(`任务已取消`)
      }

      const queryUrl = `https://wechat.easy-write.com/extract/api/query_task_simple?task_id=${taskId}`
      const queryRes = await window.fetch(queryUrl, {
        method: `GET`,
        signal: abortController.value?.signal,
      })

      if (!queryRes.ok) {
        throw new Error(`查询任务状态失败: ${queryRes.status}`)
      }

      const queryData = await queryRes.json()

      if (!queryData.success) {
        throw new Error(queryData.error || `查询任务失败`)
      }

      // 检查任务状态
      if (queryData.status === `succeeded` && queryData.images && queryData.images.length > 0) {
        // 任务成功，返回第一张图片
        loadingProgress.value = 100
        return queryData.images[0]
      }
      else if (queryData.status === `failed`) {
        throw new Error(queryData.message || `图像生成失败`)
      }
      else if (queryData.status === `running` || queryData.status === `processing`) {
        // 任务处理中，更新进度并继续等待
        const progress = Math.round((queryData.progress || 0) * 100)
        loadingProgress.value = progress
        console.log(`任务处理中，进度: ${progress}%`)
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        continue
      }
      else if (queryData.status === `unknown`) {
        throw new Error(`任务状态未知`)
      }
    }
    catch (e) {
      if ((e as Error).name === `AbortError`) {
        throw e
      }
      // 其他错误，继续重试
      if (attempt === maxAttempts - 1) {
        throw e
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
  }

  throw new Error(`任务超时，请稍后重试`)
}

/* ---------- 选择风格 ---------- */
function selectStyle(styleId: string) {
  selectedStyle.value = styleId
  // 清空输入框，等待用户输入主题
  prompt.value = ``
}

/* ---------- 构建完整提示词 ---------- */
function buildFullPrompt(userInput: string): string {
  if (!selectedStyle.value) {
    return userInput
  }

  const style = styleTemplates.find(s => s.id === selectedStyle.value)
  if (!style) {
    return userInput
  }

  // 将用户输入替换到模板中
  return style.template.replace(`{content}`, userInput)
}

/* ---------- 生成图像 ---------- */
async function generateImage() {
  if (!prompt.value.trim() || loading.value)
    return

  // 构建完整的提示词
  const userInput = prompt.value.trim()
  const currentPrompt = buildFullPrompt(userInput)
  lastUsedPrompt.value = currentPrompt

  loading.value = true
  loadingProgress.value = 0 // 重置进度
  abortController.value = new AbortController()

  const headers: Record<string, string> = { 'Content-Type': `application/json` }

  try {
    const url = endpoint.value

    const payload = {
      prompt: currentPrompt,
    }

    const res = await window.fetch(url, {
      method: `POST`,
      headers,
      body: JSON.stringify(payload),
      signal: abortController.value.signal,
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`${res.status}: ${errorText}`)
    }

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.message || `任务提交失败`)
    }

    const taskId = data.task_id
    if (!taskId) {
      throw new Error(`未收到任务ID`)
    }

    // 轮询查询任务状态
    const imageUrl = await pollTaskStatus(taskId)

    if (imageUrl) {
      const currentTimestamp = Date.now()

      generatedImages.value.unshift(imageUrl)
      imagePrompts.value.unshift(currentPrompt)
      imageTimestamps.value.unshift(currentTimestamp)
      currentImageIndex.value = 0

      // 限制存储的图片数量
      if (generatedImages.value.length > 20) {
        generatedImages.value = generatedImages.value.slice(0, 20)
        imagePrompts.value = imagePrompts.value.slice(0, 20)
        imageTimestamps.value = imageTimestamps.value.slice(0, 20)
      }

      localStorage.setItem(`poster_generated_images`, JSON.stringify(generatedImages.value))
      localStorage.setItem(`poster_image_prompts`, JSON.stringify(imagePrompts.value))
      localStorage.setItem(`poster_image_timestamps`, JSON.stringify(imageTimestamps.value))

      prompt.value = ``
      toast.success(`海报生成成功！`)
    }
  }
  catch (e) {
    if ((e as Error).name === `AbortError`) {
      console.log(`图像生成请求中止`)
      toast.info(`生成已取消`)
    }
    else {
      console.error(`图像生成失败:`, e)
      toast.error(`生成失败: ${(e as Error).message}`)
    }
  }
  finally {
    loading.value = false
    abortController.value = null
  }
}

/* ---------- 取消生成 ---------- */
function cancelGeneration() {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  loading.value = false
}

/* ---------- 清空图像 ---------- */
function clearImages() {
  generatedImages.value = []
  imagePrompts.value = []
  imageTimestamps.value = []
  currentImageIndex.value = 0
  localStorage.removeItem(`poster_generated_images`)
  localStorage.removeItem(`poster_image_prompts`)
  localStorage.removeItem(`poster_image_timestamps`)
  toast.success(`已清空所有海报`)
}

/* ---------- 下载图像 ---------- */
async function downloadImage(imageUrl: string, index: number) {
  try {
    console.log(`📥 开始下载图片:`, imageUrl)

    // 生成包含prompt信息的文件名
    const relatedPrompt = imagePrompts.value[index] || ``
    const promptPart = relatedPrompt
      ? relatedPrompt.substring(0, 20).replace(/[^\w\s-]/g, ``).replace(/\s+/g, `-`)
      : `no-prompt`
    const filename = `poster-${index + 1}-${promptPart}.png`

    // 创建临时链接直接下载
    const a = document.createElement(`a`)
    a.href = imageUrl
    a.download = filename
    a.target = `_blank` // 在新标签页打开，如果下载失败会显示图片
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    console.log(`✅ 图片下载链接已触发`)
    toast.success(`已触发下载，如果未自动下载请右键图片另存为`)
  }
  catch (error) {
    console.error(`❌ 下载图像失败:`, error)
    toast.error(`下载失败: ${(error as Error).message}`)
  }
}

/* ---------- 复制图像URL ---------- */
async function copyImageUrl(imageUrl: string) {
  try {
    await copyPlain(imageUrl)
    console.log(`✅ 图片链接已复制到剪贴板`)
    toast.success(`图片链接已复制到剪贴板`)
  }
  catch (error) {
    console.error(`❌ 复制失败:`, error)
    toast.error(`复制失败，请重试`)
  }
}

/* ---------- 重新生成 ---------- */
function regenerateImage() {
  // 使用当前图片对应的prompt
  const currentPrompt = imagePrompts.value[currentImageIndex.value]
  if (currentPrompt) {
    console.log(`🔄 重新生成图像，使用当前图片的prompt:`, currentPrompt)
    // 直接使用当前图片的prompt生成，不修改输入框内容
    regenerateWithPrompt(currentPrompt)
  }
  else {
    console.warn(`⚠️ 没有找到当前图片的prompt`)
    toast.warning(`没有找到提示词`)
  }
}

/* ---------- 使用指定prompt重新生成 ---------- */
async function regenerateWithPrompt(promptText: string) {
  if (!promptText.trim() || loading.value)
    return

  loading.value = true
  loadingProgress.value = 0 // 重置进度
  abortController.value = new AbortController()

  const headers: Record<string, string> = { 'Content-Type': `application/json` }

  try {
    const url = endpoint.value

    const payload = {
      prompt: promptText.trim(),
    }

    const res = await window.fetch(url, {
      method: `POST`,
      headers,
      body: JSON.stringify(payload),
      signal: abortController.value.signal,
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`${res.status}: ${errorText}`)
    }

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.message || `任务提交失败`)
    }

    const taskId = data.task_id
    if (!taskId) {
      throw new Error(`未收到任务ID`)
    }

    // 轮询查询任务状态
    const imageUrl = await pollTaskStatus(taskId)

    if (imageUrl) {
      const currentTimestamp = Date.now()

      generatedImages.value.unshift(imageUrl)
      imagePrompts.value.unshift(promptText.trim())
      imageTimestamps.value.unshift(currentTimestamp)
      currentImageIndex.value = 0

      // 限制存储的图片数量
      if (generatedImages.value.length > 20) {
        generatedImages.value = generatedImages.value.slice(0, 20)
        imagePrompts.value = imagePrompts.value.slice(0, 20)
        imageTimestamps.value = imageTimestamps.value.slice(0, 20)
      }

      localStorage.setItem(`poster_generated_images`, JSON.stringify(generatedImages.value))
      localStorage.setItem(`poster_image_prompts`, JSON.stringify(imagePrompts.value))
      localStorage.setItem(`poster_image_timestamps`, JSON.stringify(imageTimestamps.value))

      toast.success(`重新生成成功！`)
    }
  }
  catch (e) {
    if ((e as Error).name === `AbortError`) {
      console.log(`图像生成请求中止`)
      toast.info(`生成已取消`)
    }
    else {
      console.error(`图像生成失败:`, e)
      toast.error(`重新生成失败: ${(e as Error).message}`)
    }
  }
  finally {
    loading.value = false
    abortController.value = null
  }
}

/* ---------- 切换图像 ---------- */
function previousImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

function nextImage() {
  if (currentImageIndex.value < generatedImages.value.length - 1) {
    currentImageIndex.value++
  }
}

/* ---------- 通过后端接口上传图片URL到微信图床 ---------- */
async function uploadImageViaProxy(imageUrl: string): Promise<string> {
  try {
    console.log(`📤 通过后端上传图片URL到微信图床:`, imageUrl)

    // 调用后端接口，发送图片URL，后端下载并上传到微信图床
    const uploadResponse = await fetch(`https://wechat.easy-write.com/api/media/upload-image-url`, {
      method: `POST`,
      headers: {
        'Content-Type': `application/json`,
        'X-API-Key': `0dbe66d87befa7a9d5d7c1bdbc631a9b7dc5ce88be9a20e41c26790060802647`,
      },
      body: JSON.stringify({
        imageUrl,
      }),
    })

    if (!uploadResponse.ok) {
      if (uploadResponse.status === 413) {
        throw new Error(`图片超过服务器限制（5MB），请使用更小的尺寸`)
      }
      throw new Error(`上传失败: ${uploadResponse.status}`)
    }

    const data = await uploadResponse.json()

    if (!data.data || !data.data.url) {
      throw new Error(`上传成功但未返回图片URL`)
    }

    console.log(`✅ 上传到微信图床成功:`, data.data.url)
    return data.data.url
  }
  catch (error) {
    console.error(`❌ 上传到微信图床失败:`, error)
    throw error
  }
}

/* ---------- 插入图像到光标位置 ---------- */
async function insertImageToCursor(imageUrl: string) {
  if (!editor.value) {
    console.warn(`编辑器未初始化`)
    toast.error(`编辑器未初始化`)
    return
  }

  try {
    // 显示上传中提示
    toast.loading(`正在处理图片插入...`, { id: `upload-poster-image` })

    // 使用后端代理上传图片
    const finalImageUrl = await uploadImageViaProxy(imageUrl)

    toast.dismiss(`upload-poster-image`)

    // 获取当前图片对应的prompt
    const imagePrompt = imagePrompts.value[currentImageIndex.value] || ``
    console.log(`🔗 插入图片，使用关联的prompt:`, imagePrompt)

    // 生成简洁的alt文本
    const altText = imagePrompt.trim()
      ? imagePrompt.trim().substring(0, 30).replace(/\n/g, ` `)
      : `AI生成的海报`

    // 使用微信图床的URL生成Markdown图片语法
    const markdownImage = `![${altText}](${finalImageUrl})`

    // 获取当前光标位置并插入
    const cursor = editor.value.getCursor()
    editor.value.replaceRange(markdownImage, cursor)

    // 将光标移动到插入内容后面
    const newCursor = { line: cursor.line, ch: cursor.ch + markdownImage.length }
    editor.value.setCursor(newCursor)

    // 聚焦编辑器
    editor.value.focus()

    // 关闭弹窗
    dialogVisible.value = false

    toast.success(`海报已上传并插入`)
    console.log(`✅ 图像已成功上传到微信图床并插入到光标位置`)
  }
  catch (error) {
    toast.dismiss(`upload-poster-image`)
    const errorMsg = (error as Error).message || `插入图片失败`
    toast.error(errorMsg)
    console.error(`❌ 插入图像到光标位置失败:`, error)
  }
}

/* ---------- 查看大图 ---------- */
function viewFullImage(imageUrl: string) {
  console.log(`🔍 点击查看大图:`, imageUrl)
  if (!imageUrl) {
    console.error(`❌ 图片URL为空`)
    return
  }

  try {
    // 在新窗口中打开图片
    const newWindow = window.open(imageUrl, `_blank`, `width=800,height=600,scrollbars=yes,resizable=yes`)
    if (!newWindow) {
      console.error(`❌ 无法打开新窗口，可能被浏览器阻止`)
      // 备用方案：在当前标签页打开
      window.open(imageUrl, `_blank`)
    }
  }
  catch (error) {
    console.error(`❌ 打开图片失败:`, error)
  }
}

/* ---------- 时间相关函数 ---------- */
const currentTime = ref(Date.now())

// 每秒更新当前时间，用于实时显示剩余时间
onMounted(() => {
  const updateTime = () => {
    currentTime.value = Date.now()
  }

  // 启动定时器更新时间显示
  const timeDisplayInterval = setInterval(updateTime, 1000)

  // 组件卸载时清理定时器
  onBeforeUnmount(() => {
    clearInterval(timeDisplayInterval)
  })
})

function getTimeRemaining(index: number): string {
  if (!imageTimestamps.value[index]) {
    return `未知`
  }

  const EXPIRY_TIME = 60 * 60 * 1000 // 1小时
  const timestamp = imageTimestamps.value[index]
  const elapsed = currentTime.value - timestamp
  const remaining = EXPIRY_TIME - elapsed

  if (remaining <= 0) {
    return `已过期`
  }

  const minutes = Math.floor(remaining / (60 * 1000))
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000)

  if (minutes > 0) {
    return `${minutes}分${seconds}秒`
  }
  else {
    return `${seconds}秒`
  }
}

function getTimeRemainingClass(index: number): string {
  if (!imageTimestamps.value[index]) {
    return `text-muted-foreground`
  }

  const EXPIRY_TIME = 60 * 60 * 1000 // 1小时
  const timestamp = imageTimestamps.value[index]
  const elapsed = currentTime.value - timestamp
  const remaining = EXPIRY_TIME - elapsed

  if (remaining <= 0) {
    return `text-red-500 font-medium`
  }
  else if (remaining < 10 * 60 * 1000) { // 少于10分钟
    return `text-orange-500 font-medium`
  }
  else if (remaining < 30 * 60 * 1000) { // 少于30分钟
    return `text-yellow-600`
  }
  else {
    return `text-green-600`
  }
}
</script>

<template>
  <Dialog v-model:open="dialogVisible">
    <DialogContent
      class="bg-card text-card-foreground z-[70] max-h-[90vh] w-[95vw] flex flex-col overflow-y-auto sm:max-h-[85vh] sm:max-w-4xl"
      :style="{ height: 'auto' }"
    >
      <!-- ============ 头部 ============ -->
      <DialogHeader class="space-y-3 flex flex-col items-start">
        <div class="space-x-1 flex items-center">
          <DialogTitle class="flex items-center gap-2">
            <span>海报制作</span>
            <span class="bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-2 py-0.5 text-xs text-white font-semibold">
              NEW
            </span>
          </DialogTitle>

          <Button
            title="清空海报"
            aria-label="清空海报"
            variant="ghost"
            size="icon"
            @click="clearImages"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>

        <!-- 精美介绍 -->
        <div class="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/40 dark:via-purple-950/40 dark:to-blue-950/40 w-full border-2 border-pink-300 rounded-lg p-4 dark:border-pink-700">
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🎨</span>
              <p class="bg-gradient-to-r to-blue-600 from-pink-600 via-purple-600 bg-clip-text dark:from-pink-400 dark:via-purple-400 dark:to-blue-400 text-base text-transparent font-bold">
                全新推出！专业级 AI 海报生成工具
              </p>
            </div>
            <p class="text-sm text-gray-800 leading-relaxed dark:text-gray-200">
              我们最新推出的 AI 海报制作功能，采用先进的图像生成技术，能够根据您的文字描述快速创作出<span class="text-purple-700 font-semibold dark:text-purple-300">精美的海报作品</span>。
            </p>
            <div class="grid grid-cols-2 mt-3 gap-2">
              <div class="flex items-start gap-1.5">
                <span class="mt-0.5 text-sm text-green-600 dark:text-green-400">✓</span>
                <span class="text-xs text-gray-700 dark:text-gray-300">高质量图像输出</span>
              </div>
              <div class="flex items-start gap-1.5">
                <span class="mt-0.5 text-sm text-green-600 dark:text-green-400">✓</span>
                <span class="text-xs text-gray-700 dark:text-gray-300">智能理解描述</span>
              </div>
              <div class="flex items-start gap-1.5">
                <span class="mt-0.5 text-sm text-green-600 dark:text-green-400">✓</span>
                <span class="text-xs text-gray-700 dark:text-gray-300">专业设计风格</span>
              </div>
              <div class="flex items-start gap-1.5">
                <span class="mt-0.5 text-sm text-green-600 dark:text-green-400">✓</span>
                <span class="text-xs text-gray-700 dark:text-gray-300">一键插入编辑器</span>
              </div>
            </div>

            <!-- 温馨提示 -->
            <div class="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
              <div class="flex items-start gap-1.5 rounded bg-gray-50 p-1.5 dark:bg-gray-800/50">
                <span class="text-xs text-gray-500 dark:text-gray-400">💡</span>
                <p class="text-xs text-gray-500 leading-relaxed dark:text-gray-400">
                  使用人数多生成速度会慢,描述越详细效果越好
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 风格选择 -->
        <div class="space-y-3 w-full">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-700 font-semibold dark:text-gray-300">🎭 选择海报风格</span>
            <span v-if="selectedStyle" class="text-xs text-purple-600 dark:text-purple-400">
              (已选：{{ styleTemplates.find(s => s.id === selectedStyle)?.name }})
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              v-for="style in styleTemplates"
              :key="style.id"
              type="button"
              class="group relative overflow-hidden border-2 rounded-lg p-3 text-left transition-all duration-200"
              :class="[
                selectedStyle === style.id
                  ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-950/30'
                  : 'border-gray-200 bg-white hover:border-purple-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-600',
              ]"
              @click="selectStyle(style.id)"
            >
              <!-- 选中标记 -->
              <div
                v-if="selectedStyle === style.id"
                class="absolute right-1 top-1 h-5 w-5 flex items-center justify-center rounded-full bg-purple-500 text-white"
              >
                <span class="text-xs">✓</span>
              </div>

              <div class="flex items-start gap-2">
                <span class="text-2xl">{{ style.emoji }}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-gray-800 font-semibold dark:text-gray-200">
                    {{ style.name }}
                  </p>
                  <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                    {{ style.description }}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </DialogHeader>

      <!-- ============ 图像展示区域 ============ -->
      <div
        v-if="loading || generatedImages.length > 0"
        class="space-y-4 flex flex-shrink-0 flex-col"
      >
        <!-- 图像显示 -->
        <div class="min-h-[250px] flex items-center justify-center rounded-lg bg-gray-50 sm:min-h-[300px] dark:bg-gray-800">
          <div v-if="loading" class="flex flex-col items-center gap-4">
            <Loader2 class="animate-spin text-primary h-8 w-8" />
            <div class="flex flex-col items-center gap-2">
              <p class="text-muted-foreground text-sm">
                正在生成海报...
              </p>
              <p v-if="loadingProgress > 0" class="text-primary text-lg font-semibold">
                {{ loadingProgress }}%
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              @click="cancelGeneration"
            >
              取消生成
            </Button>
          </div>

          <div v-else-if="generatedImages.length > 0" class="space-y-3 w-full flex flex-col">
            <!-- 图像导航 -->
            <div v-if="generatedImages.length > 1" class="bg-muted/20 flex items-center justify-between rounded p-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="currentImageIndex <= 0"
                @click="previousImage"
              >
                上一张
              </Button>
              <span class="text-muted-foreground text-sm">
                {{ currentImageIndex + 1 }} / {{ generatedImages.length }}
              </span>
              <Button
                variant="outline"
                size="sm"
                :disabled="currentImageIndex >= generatedImages.length - 1"
                @click="nextImage"
              >
                下一张
              </Button>
            </div>

            <!-- 图像显示 -->
            <div class="flex items-center justify-center p-2 sm:p-4">
              <div class="group relative max-w-sm w-full cursor-pointer" @click="viewFullImage(generatedImages[currentImageIndex])">
                <img
                  :src="generatedImages[currentImageIndex]"
                  :alt="`生成的海报 ${currentImageIndex + 1}`"
                  class="border-border object-contain h-auto max-h-[300px] w-full border rounded-lg shadow-lg transition-transform sm:max-h-[350px] hover:scale-105"
                >
                <!-- 点击查看大图提示 -->
                <div class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition-opacity group-hover:bg-black/10 group-hover:opacity-100">
                  <div class="rounded-md bg-black/70 px-3 py-1 text-sm text-white">
                    点击查看大图
                  </div>
                </div>
              </div>
            </div>

            <!-- 图像信息 -->
            <div class="space-y-1 bg-muted/10 rounded px-2 py-2 sm:px-4">
              <!-- 提示词 -->
              <div class="text-muted-foreground break-words text-center text-xs">
                <span class="font-medium">提示词:</span>
                <span class="ml-1">{{ imagePrompts[currentImageIndex] || '无关联提示词' }}</span>
              </div>
              <div class="text-muted-foreground text-center text-xs">
                <span class="font-medium">剩余有效期:</span>
                <span class="ml-1" :class="getTimeRemainingClass(currentImageIndex)">
                  {{ getTimeRemaining(currentImageIndex) }}
                </span>
                <span class="font-medium">，请及时下载保存</span>
              </div>
            </div>

            <!-- 图像操作按钮 -->
            <div class="bg-muted/20 border-border flex flex-wrap justify-center gap-2 border-t rounded-b-lg p-2 sm:p-4">
              <Button
                variant="outline"
                size="sm"
                class="bg-background flex-shrink-0 text-xs sm:text-sm"
                @click="insertImageToCursor(generatedImages[currentImageIndex])"
              >
                <ImageIcon class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                插入
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="bg-background flex-shrink-0 text-xs sm:text-sm"
                @click="downloadImage(generatedImages[currentImageIndex], currentImageIndex)"
              >
                <Download class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                下载
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="bg-background flex-shrink-0 text-xs sm:text-sm"
                @click="copyImageUrl(generatedImages[currentImageIndex])"
              >
                <Copy class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                复制
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="bg-background flex-shrink-0 text-xs sm:text-sm"
                @click="regenerateImage"
              >
                <RefreshCcw class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                重新生成
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ 输入框 ============ -->
      <div class="relative mt-auto flex-shrink-0">
        <div
          class="bg-background border-border flex flex-col items-baseline gap-2 border rounded-xl px-3 py-2 pr-12 shadow-inner"
        >
          <Textarea
            v-model="prompt"
            :placeholder="selectedStyle ? styleTemplates.find(s => s.id === selectedStyle)?.placeholder || '描述你想要生成的海报...' : '请先选择一种海报风格，然后输入主题'"
            rows="2"
            class="custom-scroll min-h-16 w-full resize-none border-none bg-transparent p-0 focus-visible:outline-hidden focus:outline-hidden focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:ring-offset-0 focus-visible:ring-transparent focus:ring-transparent"
            @keydown="handleKeydown"
          />

          <!-- 生成按钮 -->
          <Button
            :disabled="!selectedStyle || (!prompt.trim() && !loading)"
            size="icon"
            :title="!selectedStyle ? '请先选择风格' : (loading ? '取消' : '生成')"
            :class="[
              // eslint-disable-next-line vue/prefer-separate-static-class
              'absolute bottom-3 right-3 rounded-full disabled:opacity-40',
              // eslint-disable-next-line vue/prefer-separate-static-class
              'bg-primary hover:bg-primary/90 text-primary-foreground',
            ]"
            :aria-label="loading ? '取消' : '生成'"
            @click="loading ? cancelGeneration() : generateImage()"
          >
            <Loader2 v-if="loading" class="animate-spin h-4 w-4" />
            <ImageIcon v-else class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
@media (pointer: coarse) {
  /* 触屏设备更细 */
  .custom-scroll::-webkit-scrollbar {
    width: 3px;
  }
}

.custom-scroll::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background-color: rgba(156, 163, 175, 0.4);
}

.custom-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.6);
}

html.dark .custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(107, 114, 128, 0.4);
}

html.dark .custom-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.7);
}

.custom-scroll {
  scrollbar-width: thin;
}
</style>
