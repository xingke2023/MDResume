<script setup lang="ts">
import {
  Camera,
  Copy,
  Download,
  Gem,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  Palette,
  RefreshCcw,
  Send,
  Settings,
  Trash2,
  Upload,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import CustomUploadForm from '@/components/CustomUploadForm.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { API_BASE_URL, API_ENDPOINTS, API_KEY, getApiUrl } from '@/config/api'
import { useDisplayStore, useStore } from '@/stores'
import useAIImageConfigStore from '@/stores/AIImageConfig'
import { copyPlain } from '@/utils/clipboard'
import AIImageConfig from './AIImageConfig.vue'

/* ---------- 组件属性 ---------- */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits([`update:open`])

/* ---------- Tab 管理 ---------- */
const activeTab = ref<`screenshot` | `poster` | `nano` | `text2img` | `upload`>(`upload`)

/* ---------- 编辑器引用 ---------- */
const store = useStore()
const displayStore = useDisplayStore()
const { editor } = storeToRefs(store)

/* ---------- Tab 1: 截图写作 - 数据 ---------- */
const screenshotInstruction = ref(``)
const screenshotImageFiles = ref<File[]>([])
const screenshotImagePreviews = ref<string[]>([])
const screenshotIsProcessing = ref(false)
const screenshotFileInput = ref<HTMLInputElement | null>(null)

/* ---------- Tab 2: 海报制作 - 数据 ---------- */
const posterSelectedStyle = ref<string>(`cartoon`)
const posterPrompt = ref<string>(``)
const posterLoading = ref(false)
const posterLoadingProgress = ref(0)
const posterGeneratedImages = ref<string[]>([])
const posterImagePrompts = ref<string[]>([])
const posterImageTimestamps = ref<number[]>([])
const posterAbortController = ref<AbortController | null>(null)
const posterCurrentImageIndex = ref(0)

// 海报风格模板
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

/* ---------- Tab 3: NanoBanana图片制作 - 数据 ---------- */
const nanoPrompt = ref(``)
const nanoImageFiles = ref<File[]>([])
const nanoImagePreviews = ref<string[]>([])
const nanoIsProcessing = ref(false)
const nanoFileInput = ref<HTMLInputElement | null>(null)
const nanoGeneratedImageUrl = ref(``)
const nanoGeneratedPrompt = ref(``)

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

      const queryUrl = `${API_BASE_URL}/extract/api/query_task_simple?task_id=${taskId}`
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
    const uploadResponse = await fetch(`${API_BASE_URL}/api/media/upload-image-url`, {
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

    const uploadResponse = await fetch(`${API_BASE_URL}/api/media/upload-image`, {
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

/* ---------- Tab 1: 截图写作 - 函数 ---------- */
// 选择图片
function selectScreenshotImage() {
  screenshotFileInput.value?.click()
}

// 处理图片选择（支持多选）
function handleScreenshotImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) {
    return
  }

  // 检查图片数量限制
  const remainingSlots = 6 - screenshotImageFiles.value.length
  if (remainingSlots <= 0) {
    toast.error(`最多只能上传 6 张图片`)
    input.value = ``
    return
  }

  // 验证并添加每个文件
  let addedCount = 0
  Array.from(files).forEach((file) => {
    // 检查是否超过限制
    if (addedCount >= remainingSlots) {
      return
    }

    // 验证文件类型
    if (!file.type.startsWith(`image/`)) {
      toast.error(`${file.name} 不是图片文件`)
      return
    }

    // 验证文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} 大小超过10MB`)
      return
    }

    // 添加文件
    screenshotImageFiles.value.push(file)
    addedCount++

    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      screenshotImagePreviews.value.push(e.target?.result as string)
    }
    reader.onerror = () => {
      toast.error(`读取 ${file.name} 失败`)
    }
    reader.readAsDataURL(file)
  })

  // 如果有文件因数量限制未添加，提示用户
  if (files.length > remainingSlots) {
    toast.warning(`已添加 ${addedCount} 张图片，最多只能上传 6 张`)
  }

  // 清空input，允许重复选择同一文件
  input.value = ``
}

// 移除指定索引的图片
function removeScreenshotImage(index: number) {
  screenshotImageFiles.value.splice(index, 1)
  screenshotImagePreviews.value.splice(index, 1)
}

// 压缩图片（针对OCR优化）
async function compressScreenshotImage(file: File, index: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement(`canvas`)
        const ctx = canvas.getContext(`2d`)!

        // OCR最佳实践：宽度1920px足够识别文字，保持宽高比
        const maxWidth = 1920
        let width = img.width
        let height = img.height

        // 如果图片宽度大于maxWidth，按比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        // 使用高质量缩放算法
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = `high`
        ctx.drawImage(img, 0, 0, width, height)

        // 转为JPEG格式，质量0.85
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                `image-${index}.jpg`,
                { type: `image/jpeg` },
              )
              resolve(compressedFile)
            }
            else {
              reject(new Error(`图片压缩失败`))
            }
          },
          `image/jpeg`,
          0.85,
        )
      }
      img.onerror = () => reject(new Error(`图片加载失败`))
    }
    reader.onerror = () => reject(new Error(`图片读取失败`))
  })
}

// 发送请求
async function handleScreenshotSubmit() {
  if (screenshotImageFiles.value.length === 0) {
    toast.error(`请至少上传一张图片`)
    return
  }

  if (!screenshotInstruction.value.trim()) {
    toast.error(`请输入写作要求`)
    return
  }

  screenshotIsProcessing.value = true

  try {
    // 压缩所有图片
    toast.loading(`正在压缩图片...`, { id: `compress-images` })
    const compressedFiles = await Promise.all(
      screenshotImageFiles.value.map((file, index) => compressScreenshotImage(file, index + 1)),
    )
    toast.dismiss(`compress-images`)
    toast.success(`图片压缩完成，开始生成文稿...`)

    // 构建 FormData
    const formData = new FormData()
    formData.append(`instruction`, screenshotInstruction.value.trim())

    // 添加压缩后的图片到 FormData
    compressedFiles.forEach((file) => {
      formData.append(`images`, file)
    })

    // 构建请求
    const apiUrl = getApiUrl(API_ENDPOINTS.IMAGE_GENERATE_ARTICLE)

    const headers: Record<string, string> = {
      'X-API-Key': API_KEY,
    }

    const response = await fetch(apiUrl, {
      method: `POST`,
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`AI接口错误详情:`, errorText)
      throw new Error(`AI 接口请求失败 (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || `截图写作处理失败`)
    }

    const article = data.data?.article || data.article

    if (!article) {
      console.error(`AI响应数据:`, data)
      throw new Error(`未返回文稿内容`)
    }

    // 显示成功并插入文稿
    toast.success(`截图写作完成！文稿已插入编辑器`)
    console.log(`生成的文稿:`, article)

    // 将文稿插入到编辑器
    await insertArticleToEditor(article)

    // 清空表单
    screenshotInstruction.value = ``
    screenshotImageFiles.value = []
    screenshotImagePreviews.value = []
  }
  catch (error) {
    console.error(`截图写作处理失败:`, error)

    let errorMessage = `处理失败`
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
      errorMessage = `处理失败: ${errorMsg}`
    }

    toast.error(errorMessage)
  }
  finally {
    screenshotIsProcessing.value = false
  }
}

// 插入文稿到编辑器
async function insertArticleToEditor(article: string) {
  if (!editor.value) {
    console.warn(`编辑器未初始化`)
    toast.error(`编辑器未初始化`)
    return
  }

  try {
    // 获取当前光标位置并插入
    const cursor = editor.value.getCursor()

    // 在光标位置插入文稿内容
    editor.value.replaceRange(`\n${article}\n`, cursor)

    // 将光标移动到插入内容后面
    const lines = article.split(`\n`)
    const newCursor = {
      line: cursor.line + lines.length + 1,
      ch: 0,
    }
    editor.value.setCursor(newCursor)

    // 聚焦编辑器
    editor.value.focus()

    toast.success(`文稿已插入编辑器`)
    console.log(`✅ 文稿已成功插入到编辑器`)
  }
  catch (error) {
    const errorMsg = (error as Error).message || `插入文稿失败`
    toast.error(errorMsg)
    console.error(`❌ 插入文稿到编辑器失败:`, error)
  }
}

/* ---------- Tab 2: 海报制作 - 函数 ---------- */
// 选择风格
function selectPosterStyle(styleId: string) {
  posterSelectedStyle.value = styleId
  posterPrompt.value = ``
}

// 构建完整提示词
function buildPosterFullPrompt(userInput: string): string {
  if (!posterSelectedStyle.value) {
    return userInput
  }

  const style = styleTemplates.find(s => s.id === posterSelectedStyle.value)
  if (!style) {
    return userInput
  }

  return style.template.replace(`{content}`, userInput)
}

// 轮询任务状态
async function pollPosterTaskStatus(taskId: string): Promise<string | null> {
  const maxAttempts = 60
  const pollInterval = 2000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (posterAbortController.value?.signal.aborted) {
        throw new Error(`任务已取消`)
      }

      const queryUrl = `${API_BASE_URL}/extract/api/query_task_simple?task_id=${taskId}`
      const queryRes = await window.fetch(queryUrl, {
        method: `GET`,
        signal: posterAbortController.value?.signal,
      })

      if (!queryRes.ok) {
        throw new Error(`查询任务状态失败: ${queryRes.status}`)
      }

      const queryData = await queryRes.json()

      if (!queryData.success) {
        throw new Error(queryData.error || `查询任务失败`)
      }

      if (queryData.status === `succeeded` && queryData.images && queryData.images.length > 0) {
        posterLoadingProgress.value = 100
        return queryData.images[0]
      }
      else if (queryData.status === `failed`) {
        throw new Error(queryData.message || `海报生成失败`)
      }
      else if (queryData.status === `running` || queryData.status === `processing`) {
        const progress = Math.round((queryData.progress || 0) * 100)
        posterLoadingProgress.value = progress
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        continue
      }
    }
    catch (e) {
      if ((e as Error).name === `AbortError`) {
        throw e
      }
      if (attempt === maxAttempts - 1) {
        throw e
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
  }

  throw new Error(`任务超时，请稍后重试`)
}

// 生成海报
async function generatePoster() {
  if (!posterPrompt.value.trim() || posterLoading.value)
    return

  const userInput = posterPrompt.value.trim()
  const currentPrompt = buildPosterFullPrompt(userInput)

  posterLoading.value = true
  posterLoadingProgress.value = 0
  posterAbortController.value = new AbortController()

  try {
    const url = getApiUrl(API_ENDPOINTS.GENERATE_IMAGE)

    const res = await window.fetch(url, {
      method: `POST`,
      headers: { 'Content-Type': `application/json` },
      body: JSON.stringify({ prompt: currentPrompt }),
      signal: posterAbortController.value.signal,
    })

    if (!res.ok) {
      throw new Error(`${res.status}: ${await res.text()}`)
    }

    const data = await res.json()

    if (!data.success || !data.task_id) {
      throw new Error(data.message || `任务提交失败`)
    }

    const imageUrl = await pollPosterTaskStatus(data.task_id)

    if (imageUrl) {
      const currentTimestamp = Date.now()
      posterGeneratedImages.value.unshift(imageUrl)
      posterImagePrompts.value.unshift(currentPrompt)
      posterImageTimestamps.value.unshift(currentTimestamp)
      posterCurrentImageIndex.value = 0

      if (posterGeneratedImages.value.length > 20) {
        posterGeneratedImages.value = posterGeneratedImages.value.slice(0, 20)
        posterImagePrompts.value = posterImagePrompts.value.slice(0, 20)
        posterImageTimestamps.value = posterImageTimestamps.value.slice(0, 20)
      }

      localStorage.setItem(`poster_generated_images`, JSON.stringify(posterGeneratedImages.value))
      localStorage.setItem(`poster_image_prompts`, JSON.stringify(posterImagePrompts.value))
      localStorage.setItem(`poster_image_timestamps`, JSON.stringify(posterImageTimestamps.value))

      posterPrompt.value = ``
      toast.success(`海报生成成功！`)
    }
  }
  catch (e) {
    if ((e as Error).name === `AbortError`) {
      toast.info(`生成已取消`)
    }
    else {
      toast.error(`生成失败: ${(e as Error).message}`)
    }
  }
  finally {
    posterLoading.value = false
    posterAbortController.value = null
  }
}

// 取消生成
function cancelPosterGeneration() {
  if (posterAbortController.value) {
    posterAbortController.value.abort()
    posterAbortController.value = null
  }
  posterLoading.value = false
}

// 清空海报
function clearPosters() {
  posterGeneratedImages.value = []
  posterImagePrompts.value = []
  posterImageTimestamps.value = []
  posterCurrentImageIndex.value = 0
  localStorage.removeItem(`poster_generated_images`)
  localStorage.removeItem(`poster_image_prompts`)
  localStorage.removeItem(`poster_image_timestamps`)
  toast.success(`已清空所有海报`)
}

// 下载海报
async function downloadPoster(imageUrl: string, index: number) {
  try {
    const relatedPrompt = posterImagePrompts.value[index] || ``
    const promptPart = relatedPrompt.substring(0, 20).replace(/[^\w\s-]/g, ``).replace(/\s+/g, `-`)
    const filename = `poster-${index + 1}-${promptPart || `no-prompt`}.png`

    const a = document.createElement(`a`)
    a.href = imageUrl
    a.download = filename
    a.target = `_blank`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    toast.success(`已触发下载`)
  }
  catch (error) {
    toast.error(`下载失败: ${(error as Error).message}`)
  }
}

// 插入海报到编辑器
async function insertPosterToEditor(imageUrl: string) {
  if (!editor.value) {
    toast.error(`编辑器未初始化`)
    return
  }

  try {
    toast.loading(`正在处理图片插入...`, { id: `upload-poster-image` })

    const uploadResponse = await fetch(`${API_BASE_URL}/api/media/upload-image-url`, {
      method: `POST`,
      headers: {
        'Content-Type': `application/json`,
        'X-API-Key': `0dbe66d87befa7a9d5d7c1bdbc631a9b7dc5ce88be9a20e41c26790060802647`,
      },
      body: JSON.stringify({ imageUrl }),
    })

    if (!uploadResponse.ok) {
      throw new Error(`上传失败: ${uploadResponse.status}`)
    }

    const data = await uploadResponse.json()

    if (!data.data || !data.data.url) {
      throw new Error(`上传成功但未返回图片URL`)
    }

    const finalImageUrl = data.data.url
    toast.dismiss(`upload-poster-image`)

    const imagePrompt = posterImagePrompts.value[posterCurrentImageIndex.value] || ``
    const altText = imagePrompt.trim()
      ? imagePrompt.trim().substring(0, 30).replace(/\n/g, ` `)
      : `AI生成的海报`

    const markdownImage = `![${altText}](${finalImageUrl})`
    const cursor = editor.value.getCursor()
    editor.value.replaceRange(markdownImage, cursor)

    const newCursor = { line: cursor.line, ch: cursor.ch + markdownImage.length }
    editor.value.setCursor(newCursor)
    editor.value.focus()

    toast.success(`海报已上传并插入`)
  }
  catch (error) {
    toast.dismiss(`upload-poster-image`)
    toast.error((error as Error).message || `插入图片失败`)
  }
}

// 切换海报
function previousPoster() {
  if (posterCurrentImageIndex.value > 0) {
    posterCurrentImageIndex.value--
  }
}

function nextPoster() {
  if (posterCurrentImageIndex.value < posterGeneratedImages.value.length - 1) {
    posterCurrentImageIndex.value++
  }
}

/* ---------- Tab 3: Nano Banana - 函数 ---------- */
// 选择图片
function selectNanoImage() {
  nanoFileInput.value?.click()
}

// 处理图片选择（支持多选）
function handleNanoImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) {
    return
  }

  // 检查图片数量限制
  const remainingSlots = 3 - nanoImageFiles.value.length
  if (remainingSlots <= 0) {
    toast.error(`最多只能上传 3 张图片`)
    input.value = ``
    return
  }

  // 验证并添加每个文件
  let addedCount = 0
  Array.from(files).forEach((file) => {
    // 检查是否超过限制
    if (addedCount >= remainingSlots) {
      return
    }

    // 验证文件类型
    if (!file.type.startsWith(`image/`)) {
      toast.error(`${file.name} 不是图片文件`)
      return
    }

    // 验证文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} 大小超过10MB`)
      return
    }

    // 添加文件
    nanoImageFiles.value.push(file)
    addedCount++

    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      nanoImagePreviews.value.push(e.target?.result as string)
    }
    reader.onerror = () => {
      toast.error(`读取 ${file.name} 失败`)
    }
    reader.readAsDataURL(file)
  })

  // 如果有文件因数量限制未添加，提示用户
  if (files.length > remainingSlots) {
    toast.warning(`已添加 ${addedCount} 张图片，最多只能上传 3 张`)
  }

  // 清空input，允许重复选择同一文件
  input.value = ``
}

// 移除指定索引的图片
function removeNanoImage(index: number) {
  nanoImageFiles.value.splice(index, 1)
  nanoImagePreviews.value.splice(index, 1)
}

// 发送请求
async function handleNanoSubmit() {
  if (!nanoPrompt.value.trim()) {
    toast.error(`请输入提示词`)
    return
  }

  nanoIsProcessing.value = true

  try {
    // 构建 FormData
    const formData = new FormData()
    formData.append(`prompt`, nanoPrompt.value.trim())

    // 如果有图片，添加到 FormData（支持多张）
    if (nanoImageFiles.value.length > 0) {
      nanoImageFiles.value.forEach((file) => {
        formData.append(`images`, file)
      })
    }

    // 构建请求
    const apiUrl = getApiUrl(API_ENDPOINTS.IMAGE_GENERATE_WECHAT)

    const headers: Record<string, string> = {
      'X-API-Key': API_KEY,
      // 不设置 Content-Type，让浏览器自动设置 multipart/form-data 的 boundary
    }

    const response = await fetch(apiUrl, {
      method: `POST`,
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`AI接口错误详情:`, errorText)
      throw new Error(`AI 接口请求失败 (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || `Nano Banana 处理失败`)
    }

    const wechatUrl = data.data?.wechatImageUrl

    if (!wechatUrl) {
      console.error(`AI响应数据:`, data)
      throw new Error(`未返回微信图片URL`)
    }

    // 显示成功并保存生成的图片URL
    toast.success(`Nano Banana 处理完成！`)
    console.log(`微信图片URL:`, wechatUrl)

    // 保存生成的图片URL和提示词，显示预览
    nanoGeneratedImageUrl.value = wechatUrl
    nanoGeneratedPrompt.value = data.data?.prompt || nanoPrompt.value

    // 清空输入表单
    nanoPrompt.value = ``
    nanoImageFiles.value = []
    nanoImagePreviews.value = []
  }
  catch (error) {
    console.error(`Nano Banana 处理失败:`, error)

    let errorMessage = `处理失败`
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
      errorMessage = `处理失败: ${errorMsg}`
    }

    toast.error(errorMessage)
  }
  finally {
    nanoIsProcessing.value = false
  }
}

// 插入NanoBanana生成的图片到编辑器
async function insertNanoGeneratedImage() {
  if (!nanoGeneratedImageUrl.value) {
    toast.error(`没有可插入的图片`)
    return
  }

  await insertNanoImageToEditor(nanoGeneratedImageUrl.value, nanoGeneratedPrompt.value)

  // 清空生成的图片
  nanoGeneratedImageUrl.value = ``
  nanoGeneratedPrompt.value = ``
}

// 插入图片到编辑器的具体实现
async function insertNanoImageToEditor(imageUrl: string, imagePrompt: string) {
  if (!editor.value) {
    console.warn(`编辑器未初始化`)
    toast.error(`编辑器未初始化`)
    return
  }

  try {
    // 生成简洁的alt文本
    const altText = imagePrompt.trim()
      ? imagePrompt.trim().substring(0, 30).replace(/\n/g, ` `)
      : `Nano Banana 生成的图片`

    // 生成Markdown图片语法
    const markdownImage = `![${altText}](${imageUrl})`

    // 获取当前光标位置并插入
    const cursor = editor.value.getCursor()
    editor.value.replaceRange(markdownImage, cursor)

    // 将光标移动到插入内容后面
    const newCursor = { line: cursor.line, ch: cursor.ch + markdownImage.length }
    editor.value.setCursor(newCursor)

    // 聚焦编辑器
    editor.value.focus()

    toast.success(`图片已插入编辑器，请预览查看`)
    console.log(`✅ 图片已成功插入到编辑器`)
  }
  catch (error) {
    const errorMsg = (error as Error).message || `插入图片失败`
    toast.error(errorMsg)
    console.error(`❌ 插入图片到编辑器失败:`, error)
  }
}
</script>

<template>
  <Dialog v-model:open="dialogVisible">
    <DialogContent
      class="bg-card text-card-foreground z-[70] h-[92vh] w-[98vw] flex flex-col overflow-y-auto p-3 sm:max-w-4xl"
    >
      <!-- ============ 头部 ============ -->
      <DialogHeader class="mb-4 flex flex-col items-start">
        <div class="w-full flex items-start gap-3">
          <!-- Tab 导航 -->
          <div class="flex flex-wrap gap-1 pr-10">
            <button
              type="button"
              class="flex items-center justify-center whitespace-nowrap border rounded-md px-3 py-1 text-sm font-medium transition-all"
              :class="[
                activeTab === 'upload'
                  ? 'border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/50 dark:from-emerald-600 dark:to-teal-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-900/30',
              ]"
              @click="activeTab = 'upload'"
            >
              本地上传
            </button>

            <button
              type="button"
              class="flex items-center justify-center whitespace-nowrap border rounded-md px-3 py-1 text-sm font-medium transition-all"
              :class="[
                activeTab === 'nano'
                  ? 'border-transparent bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 dark:from-purple-600 dark:to-purple-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-purple-500/50 dark:hover:bg-purple-900/30',
              ]"
              @click="activeTab = 'nano'"
            >
              NanoBanana图片制作
            </button>

            <button
              type="button"
              class="flex items-center justify-center whitespace-nowrap border rounded-md px-3 py-1 text-sm font-medium transition-all"
              :class="[
                activeTab === 'poster'
                  ? 'border-transparent bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/50 dark:from-orange-600 dark:to-pink-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-orange-500/50 dark:hover:bg-orange-900/30',
              ]"
              @click="activeTab = 'poster'"
            >
              海报制作
            </button>

            <button
              type="button"
              class="flex items-center justify-center whitespace-nowrap border rounded-md px-3 py-1 text-sm font-medium transition-all"
              :class="[
                activeTab === 'screenshot'
                  ? 'border-transparent bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50 dark:from-blue-600 dark:to-cyan-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500/50 dark:hover:bg-blue-900/30',
              ]"
              @click="activeTab = 'screenshot'"
            >
              截图写作
            </button>

            <button
              type="button"
              class="flex items-center justify-center whitespace-nowrap border rounded-md px-3 py-1 text-sm font-medium transition-all"
              :class="[
                activeTab === 'text2img'
                  ? 'border-transparent bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg shadow-pink-500/50 dark:from-pink-600 dark:to-violet-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-pink-500/50 dark:hover:bg-pink-900/30',
              ]"
              @click="activeTab = 'text2img'"
            >
              AI文生图
            </button>
          </div>
        </div>
      </DialogHeader>

      <!-- ============ Tab 内容区域 ============ -->

      <!-- Tab 0: 本地上传 -->
      <div v-if="activeTab === 'upload'" class="space-y-4 flex flex-1 flex-col overflow-y-auto">
        <!-- 介绍 -->
        <div class="from-emerald-50 to-teal-50 bg-gradient-to-r dark:from-emerald-950/40 dark:to-teal-950/40 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <Upload class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <p class="text-sm text-emerald-800 font-medium dark:text-emerald-300">
              将本地图片上传到图床，支持多种图床配置
            </p>
          </div>
        </div>

        <!-- 打开上传对话框按钮 -->
        <div class="flex flex-col items-center justify-center gap-4 py-8">
          <Button
            size="lg"
            class="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 text-white shadow-lg"
            @click="displayStore.toggleShowUploadImgDialog()"
          >
            <Upload class="mr-2 h-5 w-5" />
            本地图片上传至微信素材库
          </Button>
          <p class="text-muted-foreground text-center text-sm">
            支持公众号、GitHub、阿里云OSS、腾讯云COS、<br>七牛云、MinIO、R2、又拍云、Telegram等多种图床
          </p>
        </div>

        <!-- 自定义上传表单 -->
        <div class="flex-1 overflow-y-auto border-t pt-4">
          <div class="mb-3 text-sm text-gray-600 font-medium dark:text-gray-400">
            当前图床配置：
          </div>
          <CustomUploadForm />
        </div>
      </div>

      <!-- Tab 1: 截图写作 -->
      <div v-if="activeTab === 'screenshot'" class="space-y-4 flex flex-1 flex-col overflow-y-auto">
        <!-- 介绍 -->
        <div class="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <Camera class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <p class="text-sm text-blue-800 font-medium dark:text-blue-300">
              上传截图，AI自动OCR识别文字并生成Markdown文稿
            </p>
          </div>
        </div>

        <!-- 写作要求输入 -->
        <div class="space-y-2">
          <label class="text-sm text-gray-700 font-medium dark:text-gray-300">
            写作要求 <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <textarea
              v-model="screenshotInstruction"
              rows="3"
              placeholder="请输入写作要求，如：根据识别的文字整理成一篇结构化的文章..."
              class="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 transition-colors dark:border-gray-600 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        <!-- 图片上传区域 -->
        <div class="space-y-2">
          <label class="text-sm text-gray-700 font-medium dark:text-gray-300">
            上传截图 <span class="text-red-500">*</span> (最多6张)
          </label>

          <!-- 上传按钮 -->
          <button
            type="button"
            :disabled="screenshotImageFiles.length >= 6"
            class="w-full border-2 border-gray-300 rounded-lg border-dashed py-8 transition-colors disabled:cursor-not-allowed dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 dark:hover:border-blue-500 dark:hover:bg-blue-950/20"
            @click="selectScreenshotImage"
          >
            <div class="flex flex-col items-center gap-2">
              <ImagePlus class="h-8 w-8 text-gray-400" />
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ screenshotImageFiles.length > 0 ? `已选择 ${screenshotImageFiles.length}/6 张图片` : '点击选择图片' }}
              </p>
            </div>
          </button>

          <!-- 图片预览列表 -->
          <div v-if="screenshotImagePreviews.length > 0" class="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <div
              v-for="(preview, index) in screenshotImagePreviews"
              :key="index"
              class="group relative aspect-square overflow-hidden border-2 border-gray-300 rounded-lg dark:border-gray-600"
            >
              <img
                :src="preview"
                :alt="`预览图片 ${index + 1}`"
                class="object-cover h-full w-full"
              >
              <button
                class="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 shadow-lg transition-opacity hover:bg-red-600 group-hover:opacity-100"
                @click="removeScreenshotImage(index)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="mt-auto pt-4">
          <Button
            class="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 w-full border-0 text-white"
            :disabled="screenshotIsProcessing || !screenshotInstruction.trim() || screenshotImageFiles.length === 0"
            @click="handleScreenshotSubmit"
          >
            <Send v-if="!screenshotIsProcessing" class="mr-2 h-4 w-4" />
            <Loader2 v-if="screenshotIsProcessing" class="animate-spin mr-2 h-4 w-4" />
            {{ screenshotIsProcessing ? '生成中...' : '开始生成文稿' }}
          </Button>
        </div>

        <!-- 隐藏的文件选择输入框 -->
        <input
          ref="screenshotFileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handleScreenshotImageChange"
        >
      </div>

      <!-- Tab 2: 海报制作 -->
      <div v-if="activeTab === 'poster'" class="space-y-4 flex flex-1 flex-col overflow-y-auto">
        <!-- 介绍 -->
        <div class="from-pink-50 via-purple-50 to-blue-50 bg-gradient-to-br dark:from-pink-950/40 dark:via-purple-950/40 dark:to-blue-950/40 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <Palette class="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <p class="text-sm text-purple-800 font-medium dark:text-purple-300">
              选择风格，输入主题，AI为您生成专业海报
            </p>
          </div>
        </div>

        <!-- 风格选择 -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-700 font-semibold dark:text-gray-300">选择海报风格</span>
            <span v-if="posterSelectedStyle" class="text-xs text-purple-600 dark:text-purple-400">
              (已选：{{ styleTemplates.find(s => s.id === posterSelectedStyle)?.name }})
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              v-for="style in styleTemplates"
              :key="style.id"
              type="button"
              class="group relative overflow-hidden border-2 rounded-lg p-3 text-left transition-all duration-200"
              :class="[
                posterSelectedStyle === style.id
                  ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-950/30'
                  : 'border-gray-200 bg-white hover:border-purple-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-600',
              ]"
              @click="selectPosterStyle(style.id)"
            >
              <!-- 选中标记 -->
              <div
                v-if="posterSelectedStyle === style.id"
                class="absolute right-1 top-1 h-5 w-5 flex items-center justify-center rounded-full bg-purple-500 text-white"
              >
                <span class="text-xs">✓</span>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ style.emoji }}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-gray-800 font-semibold dark:text-gray-200">
                    {{ style.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ style.description }}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- 生成的海报展示 -->
        <div v-if="posterLoading || posterGeneratedImages.length > 0" class="space-y-4">
          <div class="min-h-[250px] flex items-center justify-center rounded-lg bg-gray-50 sm:min-h-[300px] dark:bg-gray-800">
            <!-- 加载中 -->
            <div v-if="posterLoading" class="flex flex-col items-center gap-4">
              <Loader2 class="animate-spin text-primary h-8 w-8" />
              <div class="flex flex-col items-center gap-2">
                <p class="text-muted-foreground text-sm">
                  正在生成海报...
                </p>
                <p v-if="posterLoadingProgress > 0" class="text-primary text-lg font-semibold">
                  {{ posterLoadingProgress }}%
                </p>
              </div>
              <Button variant="outline" size="sm" @click="cancelPosterGeneration">
                取消生成
              </Button>
            </div>

            <!-- 海报展示 -->
            <div v-else-if="posterGeneratedImages.length > 0" class="space-y-3 w-full flex flex-col">
              <!-- 导航 -->
              <div v-if="posterGeneratedImages.length > 1" class="bg-muted/20 flex items-center justify-between rounded p-2">
                <Button variant="outline" size="sm" :disabled="posterCurrentImageIndex <= 0" @click="previousPoster">
                  上一张
                </Button>
                <span class="text-muted-foreground text-sm">
                  {{ posterCurrentImageIndex + 1 }} / {{ posterGeneratedImages.length }}
                </span>
                <Button variant="outline" size="sm" :disabled="posterCurrentImageIndex >= posterGeneratedImages.length - 1" @click="nextPoster">
                  下一张
                </Button>
              </div>

              <!-- 海报图片 -->
              <div class="flex items-center justify-center p-2 sm:p-4">
                <div class="group relative max-w-sm w-full cursor-pointer" @click="viewFullImage(posterGeneratedImages[posterCurrentImageIndex])">
                  <img
                    :src="posterGeneratedImages[posterCurrentImageIndex]"
                    :alt="`生成的海报 ${posterCurrentImageIndex + 1}`"
                    class="object-contain border-border h-auto max-h-[300px] w-full border rounded-lg shadow-lg transition-transform sm:max-h-[350px] hover:scale-105"
                  >
                  <div class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition-opacity group-hover:bg-black/10 group-hover:opacity-100">
                    <div class="rounded-md bg-black/70 px-3 py-1 text-sm text-white">
                      点击查看大图
                    </div>
                  </div>
                </div>
              </div>

              <!-- 海报操作按钮 -->
              <div class="bg-muted/20 border-border flex flex-wrap justify-center gap-2 border-t rounded-b-lg p-2 sm:p-4">
                <Button
                  variant="outline"
                  size="sm"
                  class="bg-background flex-shrink-0 text-xs sm:text-sm"
                  @click="insertPosterToEditor(posterGeneratedImages[posterCurrentImageIndex])"
                >
                  <ImageIcon class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  插入
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="bg-background flex-shrink-0 text-xs sm:text-sm"
                  @click="downloadPoster(posterGeneratedImages[posterCurrentImageIndex], posterCurrentImageIndex)"
                >
                  <Download class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  下载
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="bg-background flex-shrink-0 text-xs sm:text-sm"
                  @click="clearPosters"
                >
                  <Trash2 class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  清空
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="relative mt-auto flex-shrink-0">
          <div class="bg-background border-border flex flex-col items-baseline gap-2 border rounded-xl px-3 py-2 pr-12 shadow-inner">
            <Textarea
              v-model="posterPrompt"
              :placeholder="posterSelectedStyle ? styleTemplates.find(s => s.id === posterSelectedStyle)?.placeholder || '描述你想要生成的海报...' : '请先选择一种海报风格，然后输入主题'"
              rows="2"
              class="custom-scroll min-h-16 w-full resize-none border-none bg-transparent p-0 focus-visible:outline-hidden focus:outline-hidden focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:ring-offset-0 focus-visible:ring-transparent focus:ring-transparent"
            />

            <!-- 生成按钮 -->
            <Button
              :disabled="!posterSelectedStyle || (!posterPrompt.trim() && !posterLoading)"
              size="icon"
              :title="!posterSelectedStyle ? '请先选择风格' : (posterLoading ? '取消' : '生成')"
              class="bg-primary text-primary-foreground hover:bg-primary/90 absolute bottom-3 right-3 rounded-full disabled:opacity-40"
              :aria-label="posterLoading ? '取消' : '生成'"
              @click="posterLoading ? cancelPosterGeneration() : generatePoster()"
            >
              <Loader2 v-if="posterLoading" class="animate-spin h-4 w-4" />
              <ImageIcon v-else class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <!-- Tab 3: NanoBanana图片制作 -->
      <div v-if="activeTab === 'nano'" class="space-y-4 flex flex-1 flex-col overflow-y-auto">
        <!-- 工具按钮 -->
        <div class="flex items-center gap-2">
          <Button
            v-if="nanoGeneratedImageUrl"
            title="清空图像"
            aria-label="清空图像"
            variant="outline"
            size="sm"
            @click="() => { nanoGeneratedImageUrl = ''; nanoGeneratedPrompt = '' }"
          >
            <Trash2 class="mr-1 h-4 w-4" />
            清空图像
          </Button>
        </div>

        <!-- ============ 图像展示区域 ============ -->
        <div
          v-if="nanoIsProcessing || nanoGeneratedImageUrl"
          class="space-y-4 flex flex-shrink-0 flex-col"
        >
          <!-- 图像显示 -->
          <div class="min-h-[250px] flex items-center justify-center rounded-lg bg-gray-50 sm:min-h-[300px] dark:bg-gray-800">
            <!-- 加载中 -->
            <div v-if="nanoIsProcessing" class="flex flex-col items-center gap-4">
              <Loader2 class="animate-spin text-primary h-8 w-8" />
              <p class="text-muted-foreground text-sm">
                正在生成图像...
              </p>
            </div>

            <!-- 生成的图片 -->
            <div v-else-if="nanoGeneratedImageUrl" class="space-y-3 w-full flex flex-col">
              <!-- 图像显示 -->
              <div class="flex items-center justify-center p-2 sm:p-4">
                <div class="group relative max-w-sm w-full cursor-pointer" @click="viewFullImage(nanoGeneratedImageUrl)">
                  <img
                    :src="nanoGeneratedImageUrl"
                    :alt="nanoGeneratedPrompt"
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
                <div class="text-muted-foreground break-words text-center text-xs">
                  <span class="font-medium">提示词:</span>
                  <span class="ml-1">{{ nanoGeneratedPrompt || '无提示词' }}</span>
                </div>
              </div>

              <!-- 图像操作按钮 -->
              <div class="bg-muted/20 border-border flex flex-wrap justify-center gap-2 border-t rounded-b-lg p-2 sm:p-4">
                <Button
                  variant="outline"
                  size="sm"
                  class="bg-background flex-shrink-0 text-xs sm:text-sm"
                  @click="insertNanoGeneratedImage"
                >
                  <ImageIcon class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  插入
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="bg-background flex-shrink-0 text-xs sm:text-sm"
                  @click="downloadImage(nanoGeneratedImageUrl, 0)"
                >
                  <Download class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  下载
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="bg-background flex-shrink-0 text-xs sm:text-sm"
                  @click="copyImageUrl(nanoGeneratedImageUrl)"
                >
                  <Copy class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  复制链接
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- 介绍 -->
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <Gem class="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <p class="text-sm text-purple-800 font-medium dark:text-purple-300">
              使用 Google 最新的图片模型，支持文本生图和图片理解分析
            </p>
          </div>
        </div>

        <!-- 提示词输入 -->
        <div class="space-y-2">
          <label class="text-sm text-gray-700 font-medium dark:text-gray-300">
            提示词 <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <textarea
              v-model="nanoPrompt"
              rows="4"
              placeholder="请描述您想让 AI 对这张图片做什么分析或处理..."
              class="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 pb-10 text-sm text-gray-900 transition-colors dark:border-gray-600 focus:border-purple-500 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:placeholder:text-gray-500"
            />

            <!-- 附件上传按钮 -->
            <div class="absolute bottom-2 left-2 flex items-center gap-2">
              <button
                type="button"
                :disabled="nanoImageFiles.length >= 3"
                class="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 transition-colors disabled:cursor-not-allowed hover:bg-gray-100 dark:text-gray-400 disabled:opacity-50 dark:hover:bg-gray-700"
                @click="selectNanoImage"
              >
                <ImagePlus class="h-4 w-4" />
                <span>{{ nanoImageFiles.length > 0 ? `${nanoImageFiles.length}/3 张图片` : '添加图片' }}</span>
              </button>
            </div>
          </div>

          <!-- 图片预览列表 -->
          <div v-if="nanoImagePreviews.length > 0" class="flex flex-wrap gap-2">
            <div
              v-for="(preview, index) in nanoImagePreviews"
              :key="index"
              class="group relative h-16 w-16 overflow-hidden border-2 border-gray-300 rounded-lg dark:border-gray-600"
            >
              <img
                :src="preview"
                :alt="`预览图片 ${index + 1}`"
                class="object-cover h-full w-full"
              >
              <button
                class="absolute right-0.5 top-0.5 rounded-full bg-red-500 p-0.5 text-white opacity-0 shadow-lg transition-opacity hover:bg-red-600 group-hover:opacity-100"
                @click="removeNanoImage(index)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
          <p class="text-sm text-purple-800 dark:text-purple-300">
            <span class="font-medium">💡 提示：</span>本工具支持纯文本生成图片，也支持上传图片进行理解、物体识别、场景分析等多种功能
          </p>
        </div>

        <!-- 提交按钮 -->
        <div class="mt-auto pt-4">
          <Button
            class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 w-full border-0 text-white"
            :disabled="nanoIsProcessing || !nanoPrompt.trim()"
            @click="handleNanoSubmit"
          >
            <Send v-if="!nanoIsProcessing" class="mr-2 h-4 w-4" />
            <Loader2 v-if="nanoIsProcessing" class="animate-spin mr-2 h-4 w-4" />
            {{ nanoIsProcessing ? '处理中...' : '发送' }}
          </Button>
        </div>

        <!-- 隐藏的文件选择输入框（支持多选） -->
        <input
          ref="nanoFileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handleNanoImageChange"
        >
      </div>

      <!-- Tab 4: AI 文生图 (原有功能) -->
      <div v-if="activeTab === 'text2img'" class="space-y-4 flex flex-1 flex-col">
        <!-- 工具按钮 -->
        <div class="flex items-center gap-2">
          <Button
            :title="configVisible ? 'AI 文生图' : '配置参数'"
            :aria-label="configVisible ? 'AI 文生图' : '配置参数'"
            variant="outline"
            size="sm"
            @click="configVisible = !configVisible"
          >
            <Settings class="mr-1 h-4 w-4" />
            模型配置
          </Button>

          <Button
            v-if="generatedImages.length > 0"
            title="清空图像"
            aria-label="清空图像"
            variant="outline"
            size="sm"
            @click="clearImages"
          >
            <Trash2 class="mr-1 h-4 w-4" />
            清空图像
          </Button>
        </div>

        <!-- ============ 参数配置面板 ============ -->
        <div
          v-if="configVisible"
          class="mb-4 h-[60vh] w-full flex flex-shrink-0 flex-col border rounded-md"
        >
          <div class="flex-1 overflow-y-auto p-4">
            <AIImageConfig @saved="handleConfigSaved" />
          </div>
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
