<script setup lang="ts">
import {
  Copy,
  Download,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  RefreshCcw,
  Settings,
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
import { useDisplayStore, useStore } from '@/stores'
import useAIImageConfigStore from '@/stores/AIImageConfig'
import { copyPlain } from '@/utils/clipboard'
import AIImageConfig from './AIImageConfig.vue'

/* ---------- 组件属性 ---------- */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits([`update:open`])

/* ---------- 编辑器引用 ---------- */
const store = useStore()
const { editor } = storeToRefs(store)
const displayStore = useDisplayStore()
const { toggleAIDialog } = displayStore

/* ---------- 弹窗开关 ---------- */
const dialogVisible = ref(props.open)
watch(() => props.open, (val) => {
  dialogVisible.value = val
  // 每次打开面板时检查并清理过期图片
  if (val) {
    cleanExpiredImages()
  }
})
watch(dialogVisible, val => emit(`update:open`, val))

/* ---------- 状态管理 ---------- */
const configVisible = ref(false)
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

/* ---------- AI 配置 ---------- */
const AIImageConfigStore = useAIImageConfigStore()
const { apiKey, endpoint, model, type, size, quality, style } = storeToRefs(AIImageConfigStore)

/* ---------- 过期检查函数 ---------- */
function isImageExpired(timestamp: number): boolean {
  const EXPIRY_TIME = 60 * 60 * 1000 // 1小时，单位毫秒
  const now = Date.now()
  return now - timestamp > EXPIRY_TIME
}

function cleanExpiredImages() {
  const savedImages = localStorage.getItem(`ai_generated_images`)
  const savedPrompts = localStorage.getItem(`ai_image_prompts`)
  const savedTimestamps = localStorage.getItem(`ai_image_timestamps`)

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
    localStorage.removeItem(`ai_generated_images`)
    localStorage.removeItem(`ai_image_prompts`)
    localStorage.removeItem(`ai_image_timestamps`)
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
      localStorage.setItem(`ai_generated_images`, JSON.stringify(validImages))
      localStorage.setItem(`ai_image_prompts`, JSON.stringify(validPrompts))
      localStorage.setItem(`ai_image_timestamps`, JSON.stringify(validTimestamps))
    }
    else {
      localStorage.removeItem(`ai_generated_images`)
      localStorage.removeItem(`ai_image_prompts`)
      localStorage.removeItem(`ai_image_timestamps`)
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
    localStorage.removeItem(`ai_generated_images`)
    localStorage.removeItem(`ai_image_prompts`)
    localStorage.removeItem(`ai_image_timestamps`)
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
function handleConfigSaved() {
  configVisible.value = false
}

function switchToChat() {
  // 先关闭当前文生图对话框
  emit(`update:open`, false)
  // 然后打开聊天对话框
  setTimeout(() => {
    toggleAIDialog(true)
  }, 100)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229)
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

/* ---------- 生成图像 ---------- */
async function generateImage() {
  if (!prompt.value.trim() || loading.value)
    return

  // 保存当前提示词用于重新生成
  const currentPrompt = prompt.value.trim()
  lastUsedPrompt.value = currentPrompt

  loading.value = true
  loadingProgress.value = 0 // 重置进度
  abortController.value = new AbortController()

  const headers: Record<string, string> = { 'Content-Type': `application/json` }
  if (apiKey.value && type.value !== `default` && type.value !== `aiwriting`)
    headers.Authorization = `Bearer ${apiKey.value}`

  try {
    const url = new URL(endpoint.value)

    // 人工智能写作服务不修改路径，其他服务添加标准路径
    if (type.value !== `aiwriting`) {
      if (!url.pathname.includes(`/images/`) && !url.pathname.endsWith(`/images/generations`)) {
        url.pathname = url.pathname.replace(/\/?$/, `/images/generations`)
      }
    }

    const payload: any = {
      prompt: currentPrompt,
    }

    // 只为非人工智能写作服务添加标准参数
    if (type.value !== `aiwriting`) {
      payload.model = model.value
      payload.size = size.value
      payload.n = 1

      // 只对 DALL-E 模型添加额外参数
      if (model.value.includes(`dall-e`)) {
        payload.quality = quality.value
        payload.style = style.value
      }
    }

    const res = await window.fetch(url.toString(), {
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

    // 处理人工智能写作服务的响应
    if (type.value === `aiwriting`) {
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

        localStorage.setItem(`ai_generated_images`, JSON.stringify(generatedImages.value))
        localStorage.setItem(`ai_image_prompts`, JSON.stringify(imagePrompts.value))
        localStorage.setItem(`ai_image_timestamps`, JSON.stringify(imageTimestamps.value))

        prompt.value = ``
      }
    }
    else {
      // 处理标准 OpenAI 格式的响应
      if (data.data && data.data.length > 0) {
        const imageUrl = data.data[0].url || data.data[0].b64_json

        if (imageUrl) {
          // 如果是 base64 格式，转换为 data URL
          const finalUrl = imageUrl.startsWith(`data:`) || imageUrl.startsWith(`http`)
            ? imageUrl
            : `data:image/png;base64,${imageUrl}`

          const currentTimestamp = Date.now()

          generatedImages.value.unshift(finalUrl)
          imagePrompts.value.unshift(currentPrompt) // 保存对应的prompt
          imageTimestamps.value.unshift(currentTimestamp) // 保存生成时间戳
          currentImageIndex.value = 0

          // 限制存储的图片数量，避免占用过多存储空间
          if (generatedImages.value.length > 20) {
            generatedImages.value = generatedImages.value.slice(0, 20)
            imagePrompts.value = imagePrompts.value.slice(0, 20)
            imageTimestamps.value = imageTimestamps.value.slice(0, 20)
          }

          localStorage.setItem(`ai_generated_images`, JSON.stringify(generatedImages.value))
          localStorage.setItem(`ai_image_prompts`, JSON.stringify(imagePrompts.value))
          localStorage.setItem(`ai_image_timestamps`, JSON.stringify(imageTimestamps.value))

          // 清空输入框
          prompt.value = ``
        }
      }
      else {
        throw new Error(`未收到有效的图像数据`)
      }
    }
  }
  catch (e) {
    if ((e as Error).name === `AbortError`) {
      console.log(`图像生成请求中止`)
    }
    else {
      console.error(`图像生成失败:`, e)
      // 可以在这里添加错误提示
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
  localStorage.removeItem(`ai_generated_images`)
  localStorage.removeItem(`ai_image_prompts`)
  localStorage.removeItem(`ai_image_timestamps`)
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
    const filename = `ai-image-${index + 1}-${promptPart}.png`

    // 人工智能写作服务的图片有 CORS 限制，直接使用 URL 下载
    if (type.value === `aiwriting`) {
      // 创建临时链接直接下载
      const a = document.createElement(`a`)
      a.href = imageUrl
      a.download = filename
      a.target = `_blank` // 在新标签页打开，如果下载失败会显示图片
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      console.log(`✅ 图片下载链接已触发`)
      if (typeof toast !== `undefined`) {
        toast.success(`已触发下载，如果未自动下载请右键图片另存为`)
      }
    }
    else {
      // 其他服务商使用 fetch 方式下载
      const response = await fetch(imageUrl)
      console.log(`📥 Fetch 响应状态:`, response.status)

      if (!response.ok) {
        throw new Error(`HTTP 错误: ${response.status}`)
      }

      const blob = await response.blob()
      console.log(`📥 Blob 大小:`, blob.size, `类型:`, blob.type)

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement(`a`)
      a.href = url
      a.download = filename

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      console.log(`✅ 图片下载成功`)
    }
  }
  catch (error) {
    console.error(`❌ 下载图像失败:`, error)
    if (typeof toast !== `undefined`) {
      toast.error(`下载失败: ${(error as Error).message}`)
    }
  }
}

/* ---------- 复制图像URL ---------- */
async function copyImageUrl(imageUrl: string) {
  try {
    await copyPlain(imageUrl)
    console.log(`✅ 图片链接已复制到剪贴板`)
    if (typeof toast !== `undefined`) {
      toast.success(`图片链接已复制到剪贴板`)
    }
  }
  catch (error) {
    console.error(`❌ 复制失败:`, error)
    if (typeof toast !== `undefined`) {
      toast.error(`复制失败，请重试`)
    }
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
  if (apiKey.value && type.value !== `default` && type.value !== `aiwriting`)
    headers.Authorization = `Bearer ${apiKey.value}`

  try {
    const url = new URL(endpoint.value)

    // 人工智能写作服务不修改路径，其他服务添加标准路径
    if (type.value !== `aiwriting`) {
      if (!url.pathname.includes(`/images/`) && !url.pathname.endsWith(`/images/generations`)) {
        url.pathname = url.pathname.replace(/\/?$/, `/images/generations`)
      }
    }

    const payload: any = {
      prompt: promptText.trim(),
    }

    // 只为非人工智能写作服务添加标准参数
    if (type.value !== `aiwriting`) {
      payload.model = model.value
      payload.size = size.value
      payload.n = 1

      // 只对 DALL-E 模型添加额外参数
      if (model.value.includes(`dall-e`)) {
        payload.quality = quality.value
        payload.style = style.value
      }
    }

    const res = await window.fetch(url.toString(), {
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

    // 处理人工智能写作服务的响应
    if (type.value === `aiwriting`) {
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

        localStorage.setItem(`ai_generated_images`, JSON.stringify(generatedImages.value))
        localStorage.setItem(`ai_image_prompts`, JSON.stringify(imagePrompts.value))
        localStorage.setItem(`ai_image_timestamps`, JSON.stringify(imageTimestamps.value))
      }
    }
    else {
      // 处理标准 OpenAI 格式的响应
      if (data.data && data.data.length > 0) {
        const imageUrl = data.data[0].url || data.data[0].b64_json

        if (imageUrl) {
          // 如果是 base64 格式，转换为 data URL
          const finalUrl = imageUrl.startsWith(`data:`) || imageUrl.startsWith(`http`)
            ? imageUrl
            : `data:image/png;base64,${imageUrl}`

          const currentTimestamp = Date.now()

          generatedImages.value.unshift(finalUrl)
          imagePrompts.value.unshift(promptText.trim()) // 保存对应的prompt
          imageTimestamps.value.unshift(currentTimestamp) // 保存生成时间戳
          currentImageIndex.value = 0

          // 限制存储的图片数量，避免占用过多存储空间
          if (generatedImages.value.length > 20) {
            generatedImages.value = generatedImages.value.slice(0, 20)
            imagePrompts.value = imagePrompts.value.slice(0, 20)
            imageTimestamps.value = imageTimestamps.value.slice(0, 20)
          }

          localStorage.setItem(`ai_generated_images`, JSON.stringify(generatedImages.value))
          localStorage.setItem(`ai_image_prompts`, JSON.stringify(imagePrompts.value))
          localStorage.setItem(`ai_image_timestamps`, JSON.stringify(imageTimestamps.value))
        }
      }
      else {
        throw new Error(`未收到有效的图像数据`)
      }
    }
  }
  catch (e) {
    if ((e as Error).name === `AbortError`) {
      console.log(`图像生成请求中止`)
    }
    else {
      console.error(`图像生成失败:`, e)
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

/* ---------- 上传图片到微信图床 ---------- */
async function uploadToWechat(imageUrl: string): Promise<string> {
  try {
    console.log(`📤 开始上传图片到微信图床:`, imageUrl)

    // 将图片 URL 转换为 Blob
    const response = await fetch(imageUrl)
    console.log(`📤 Fetch 响应状态:`, response.status)

    if (!response.ok) {
      throw new Error(`获取图片失败: HTTP ${response.status}`)
    }

    const blob = await response.blob()
    console.log(`📤 Blob 大小:`, blob.size, `类型:`, blob.type)

    // 检查文件大小（5MB限制）
    const maxSize = 5 * 1024 * 1024
    if (blob.size > maxSize) {
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2)
      throw new Error(`图片大小为 ${sizeMB}MB，超过限制 5MB，请使用更小的尺寸`)
    }

    // 创建 File 对象
    const file = new File([blob], `ai-generated.png`, { type: `image/png` })

    // 上传到微信图床
    const formData = new FormData()
    formData.append(`media`, file)

    const uploadResponse = await fetch(`https://wechat.easy-write.com/api/media/upload-image`, {
      method: `POST`,
      headers: {
        'X-API-Key': `0dbe66d87befa7a9d5d7c1bdbc631a9b7dc5ce88be9a20e41c26790060802647`,
      },
      body: formData,
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

    return data.data.url
  }
  catch (error) {
    console.error(`上传到微信图床失败:`, error)
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
    toast.loading(`正在处理图片插入...`, { id: `upload-ai-image` })

    let finalImageUrl = imageUrl

    // 人工智能写作服务的图片需要通过代理上传到微信图床
    if (type.value === `aiwriting`) {
      // 使用后端代理上传图片
      finalImageUrl = await uploadImageViaProxy(imageUrl)
    }
    else {
      // 其他服务商直接上传到微信图床
      finalImageUrl = await uploadToWechat(imageUrl)
    }

    toast.dismiss(`upload-ai-image`)

    // 获取当前图片对应的prompt
    const imagePrompt = imagePrompts.value[currentImageIndex.value] || ``
    console.log(`🔗 插入图片，使用关联的prompt:`, imagePrompt)

    // 生成简洁的alt文本
    const altText = imagePrompt.trim()
      ? imagePrompt.trim().substring(0, 30).replace(/\n/g, ` `)
      : `AI生成的图像`

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

    toast.success(`图片已上传并插入`)
    console.log(`✅ 图像已成功上传到微信图床并插入到光标位置`)
  }
  catch (error) {
    toast.dismiss(`upload-ai-image`)
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
      class="bg-card text-card-foreground z-[70] h-auto max-h-[90vh] w-[95vw] flex flex-col overflow-y-auto sm:max-h-[85vh] sm:max-w-4xl"
    >
      <!-- ============ 头部 ============ -->
      <DialogHeader class="space-y-1 flex flex-col items-start">
        <div class="space-x-1 flex items-center">
          <DialogTitle>AI 文生图</DialogTitle>

          <Button
            :title="configVisible ? 'AI 文生图' : '配置参数'"
            :aria-label="configVisible ? 'AI 文生图' : '配置参数'"
            variant="ghost"
            size="icon"
            @click="configVisible = !configVisible"
          >
            <ImageIcon v-if="configVisible" class="h-4 w-4" />
            <Settings v-else class="h-4 w-4" />
          </Button>

          <Button
            title="AI 对话"
            aria-label="AI 对话"
            variant="ghost"
            size="icon"
            @click="switchToChat()"
          >
            <MessageCircle class="h-4 w-4" />
          </Button>

          <Button
            title="清空图像"
            aria-label="清空图像"
            variant="ghost"
            size="icon"
            @click="clearImages"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
        <p class="text-muted-foreground text-sm">
          使用 AI 根据文字描述生成图像
        </p>
      </DialogHeader>

      <!-- ============ 参数配置面板 ============ -->
      <div
        v-if="configVisible"
        class="mb-4 max-h-[60vh] w-full flex-shrink-0 overflow-y-auto border rounded-md p-4"
      >
        <AIImageConfig @saved="handleConfigSaved" />
      </div>

      <!-- ============ 图像展示区域 ============ -->
      <div
        v-if="!configVisible && (loading || generatedImages.length > 0)"
        class="space-y-4 flex flex-shrink-0 flex-col"
      >
        <!-- 图像显示 -->
        <div class="min-h-[250px] flex items-center justify-center rounded-lg bg-gray-50 sm:min-h-[300px] dark:bg-gray-800">
          <div v-if="loading" class="flex flex-col items-center gap-4">
            <Loader2 class="animate-spin text-primary h-8 w-8" />
            <div class="flex flex-col items-center gap-2">
              <p class="text-muted-foreground text-sm">
                正在生成图像...
              </p>
              <p v-if="type === 'aiwriting' && loadingProgress > 0" class="text-primary text-lg font-semibold">
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
                  :alt="`生成的图像 ${currentImageIndex + 1}`"
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
              <p class="text-muted-foreground text-center text-xs">
                尺寸: {{ size }}
              </p>
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
      <div v-if="!configVisible" class="relative mt-auto flex-shrink-0">
        <div
          class="bg-background border-border flex flex-col items-baseline gap-2 border rounded-xl px-3 py-2 pr-12 shadow-inner"
        >
          <Textarea
            v-model="prompt"
            placeholder="描述你想要生成的图像... (Enter 生成，Shift+Enter 换行)"
            rows="2"
            class="custom-scroll min-h-16 w-full resize-none border-none bg-transparent p-0 focus-visible:outline-hidden focus:outline-hidden focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:ring-offset-0 focus-visible:ring-transparent focus:ring-transparent"
            @keydown="handleKeydown"
          />

          <!-- 生成按钮 -->
          <Button
            :disabled="!prompt.trim() && !loading"
            size="icon"
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
