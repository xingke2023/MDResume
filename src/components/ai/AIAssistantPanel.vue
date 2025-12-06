<script setup lang="ts">
import {
  ArrowDown,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit,
  ImagePlus,
  Loader2,
  Maximize2,
  Pause,
  Plus,
  RefreshCcw,
  Replace,
  Send,
  Settings,
  Trash2,
  X,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, ref, toRaw, watch } from 'vue'
import PosterGeneratorDialog from '@/components/ai/PosterGeneratorDialog.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { API_ENDPOINTS, API_KEY, getApiUrl } from '@/config/api'
import { useDisplayStore, useStore } from '@/stores'
import useAIConfigStore from '@/stores/AIConfig'
import type { QuickCommandRuntime } from '@/stores/useQuickCommands'
import { useQuickCommands } from '@/stores/useQuickCommands'
import { copyPlain } from '@/utils/clipboard'

/* ---------- 组件属性 ---------- */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits([`update:open`])

const store = useStore()
const { editor } = storeToRefs(store)
const displayStore = useDisplayStore()
const { toggleAIImageDialog } = displayStore

/* ---------- 菜单按钮 ---------- */
/* ---------- 弹窗开关 ---------- */
const dialogVisible = ref(props.open)
const activeTab = ref(`text-edit`)
const posterDialogVisible = ref(false)

function switchToTextEdit() {
  activeTab.value = `text-edit`
}

function switchToAIImage() {
  // 切换到AI文生图
  dialogVisible.value = false
  setTimeout(() => toggleAIImageDialog(true), 100)
}

function switchToPoster() {
  // 打开海报制作对话框
  posterDialogVisible.value = true
}
watch(() => props.open, (val: boolean) => (dialogVisible.value = val))
watch(dialogVisible, (val: boolean) => {
  emit(`update:open`, val)
  if (val) {
    scrollToBottom(true)
    // 不再默认选择任何上下文选项
  }
})

/* ---------- 输入 & 历史 ---------- */
const input = ref<string>(``)
const inputHistory = ref<string[]>([])
const historyIndex = ref<number | null>(null)

/* ---------- 配置 & 状态 ---------- */
const configVisible = ref(false)
const loading = ref(false)
const fetchController = ref<AbortController | null>(null)
const copiedIndex = ref<number | null>(null)
const memoryKey = `ai_memory_context`
const isQuoteAllContent = ref(false)
const isQuoteCursorBefore = ref(false)
const isQuoteCursorMiddle = ref(false)
const cmdMgrOpen = ref(false)
const quotedContent = ref(``)
const contextSectionCollapsed = ref(false) // 上下文区域折叠状态
const expandedViewVisible = ref(false) // 放大查看对话框
const expandedViewContent = ref(``) // 放大查看的内容
const expandedViewTitle = ref(``) // 放大查看的标题
const referenceText = ref(``) // 参考文本内容

/* ---------- 图片素材管理 ---------- */
interface ImageMaterial {
  id: string
  file: File
  preview: string
  ocrText: string
  isProcessing: boolean
  error: string | null
}

const imageMaterials = ref<ImageMaterial[]>([])
const imageFileInput = ref<HTMLInputElement | null>(null)

/* ---------- 消息结构 ---------- */
interface ChatMessage {
  role: `user` | `assistant` | `system`
  content: string
  reasoning?: string
  done?: boolean
}

const messages = ref<ChatMessage[]>([])
const AIConfigStore = useAIConfigStore()
const { apiKey, endpoint, model, temperature, maxToken, type } = storeToRefs(AIConfigStore)

/* ---------- 快捷指令 ---------- */
const quickCmdStore = useQuickCommands()

/* ---------- 引用内容管理 ---------- */
function setQuotedContent(content: string) {
  quotedContent.value = content
  // 设置引用内容时清除其他上下文状态
  if (content.trim()) {
    isQuoteAllContent.value = false
    isQuoteCursorBefore.value = false
    isQuoteCursorMiddle.value = false
  }
}

function clearQuotedContent() {
  quotedContent.value = ``
  isQuoteAllContent.value = false
  isQuoteCursorBefore.value = false
  isQuoteCursorMiddle.value = false
}

/* ---------- 图片素材功能 ---------- */
// 打开文件选择对话框
function selectImageMaterial() {
  imageFileInput.value?.click()
}

// 处理图片选择
async function handleImageSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) {
    return
  }

  // 处理每个选中的文件
  for (const file of Array.from(files)) {
    // 验证文件类型
    if (!file.type.startsWith(`image/`)) {
      showCustomToast(`${file.name} 不是图片文件`)
      continue
    }

    // 验证文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      showCustomToast(`${file.name} 大小超过10MB`)
      continue
    }

    // 生成预览
    const reader = new FileReader()
    reader.onload = async (e) => {
      const preview = e.target?.result as string
      const material: ImageMaterial = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview,
        ocrText: ``,
        isProcessing: true,
        error: null,
      }
      imageMaterials.value.push(material)

      // 调用OCR API
      await performOCR(material)
    }
    reader.onerror = () => {
      showCustomToast(`读取 ${file.name} 失败`)
    }
    reader.readAsDataURL(file)
  }

  // 清空input，允许重复选择同一文件
  input.value = ``
}

// 压缩图片（针对OCR优化）
async function compressImage(file: File, index: number): Promise<File> {
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

        // 转为JPEG格式，质量0.85（对OCR文字识别影响很小，但能大幅减小文件大小）
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // 使用序号命名：image-1.jpg, image-2.jpg, ...
              const compressedFile = new File(
                [blob],
                `image-${index}.jpg`,
                { type: `image/jpeg` },
              )

              // 计算压缩比例
              const originalSizeKB = (file.size / 1024).toFixed(2)
              const compressedSizeKB = (compressedFile.size / 1024).toFixed(2)
              const ratio = ((1 - compressedFile.size / file.size) * 100).toFixed(1)

              console.log(`图片${index}压缩: ${file.name} → image-${index}.jpg`)
              console.log(`  原始大小: ${originalSizeKB} KB`)
              console.log(`  压缩后: ${compressedSizeKB} KB`)
              console.log(`  压缩率: ${ratio}%`)

              resolve(compressedFile)
            }
            else {
              reject(new Error(`图片压缩失败`))
            }
          },
          `image/jpeg`,
          0.85, // JPEG质量：0.85对文字识别足够，同时大幅减小文件
        )
      }
      img.onerror = () => reject(new Error(`图片加载失败`))
    }
    reader.onerror = () => reject(new Error(`图片读取失败`))
  })
}

// 执行OCR识别
async function performOCR(material: ImageMaterial) {
  // 获取在数组中的索引
  const arrayIndex = imageMaterials.value.findIndex(m => m.id === material.id)
  if (arrayIndex === -1) {
    return
  }

  try {
    // 先压缩图片（使用序号，从1开始）
    const compressedFile = await compressImage(material.file, arrayIndex + 1)

    const formData = new FormData()
    formData.append(`images`, compressedFile)

    const apiUrl = getApiUrl(API_ENDPOINTS.IMAGE_OCR)

    const response = await fetch(apiUrl, {
      method: `POST`,
      headers: {
        'X-API-Key': API_KEY,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`OCR请求失败 (${response.status})`)
    }

    const data = await response.json()

    if (data.success && data.data?.results && data.data.results.length > 0) {
      const result = data.data.results[0] // 每次只上传一张图片，取第一个结果
      if (result.success && result.text) {
        // 通过索引直接更新数组中的元素，确保响应式更新
        imageMaterials.value[arrayIndex].ocrText = result.text
        imageMaterials.value[arrayIndex].error = null
        showCustomToast(`${material.file.name} OCR识别完成 (${result.textCount}行文字)`)
      }
      else {
        throw new Error(`图片识别失败`)
      }
    }
    else {
      throw new Error(data.message || `OCR返回数据异常`)
    }
  }
  catch (error) {
    console.error(`OCR识别失败:`, error)
    // 通过索引直接更新数组中的元素
    imageMaterials.value[arrayIndex].error = error instanceof Error ? error.message : `识别失败`
    showCustomToast(`${material.file.name} OCR识别失败`)
  }
  finally {
    // 通过索引直接更新数组中的元素，确保响应式更新
    imageMaterials.value[arrayIndex].isProcessing = false
  }
}

// 移除图片素材
function removeImageMaterial(id: string) {
  const index = imageMaterials.value.findIndex(m => m.id === id)
  if (index !== -1) {
    imageMaterials.value.splice(index, 1)
  }
}

// 清空所有图片素材
function clearAllImageMaterials() {
  imageMaterials.value = []
}

// 暴露方法给父组件
defineExpose({
  setQuotedContent,
  clearQuotedContent,
})

function getSelectedText(): string {
  try {
    const cm: any = editor.value
    if (!cm || typeof cm.getSelection !== `function`)
      return ``
    return cm.getSelection() || ``
  }
  catch (e) {
    console.warn(`获取选中文本失败`, e)
    return ``
  }
}

function applyQuickCommand(cmd: QuickCommandRuntime) {
  const selected = getSelectedText()
  input.value = cmd.buildPrompt(selected)
  historyIndex.value = null
  nextTick(() => {
    const textarea = document.querySelector(
      `textarea[placeholder*="说些什么" ]`,
    ) as HTMLTextAreaElement | null
    textarea?.focus()
    if (textarea) {
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  })
}

/* ---------- 初始数据 ---------- */
onMounted(async () => {
  const saved = localStorage.getItem(memoryKey)
  messages.value = saved ? JSON.parse(saved) : getDefaultMessages()
  await scrollToBottom(true)
})
function getDefaultMessages(): ChatMessage[] {
  // return [{ role: `assistant`, content: `你好，我是 AI 助手，请输入写作要求。` }]
  return []
}

/* ---------- 事件处理 ---------- */
function handleConfigSaved() {
  configVisible.value = false
  scrollToBottom(true)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229)
    return

  if (e.key === `Enter` && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
  else if (e.key === `ArrowUp`) {
    e.preventDefault()
    if (inputHistory.value.length === 0)
      return
    if (historyIndex.value === null) {
      historyIndex.value = inputHistory.value.length - 1
    }
    else if (historyIndex.value > 0) {
      historyIndex.value--
    }
    input.value = inputHistory.value[historyIndex.value] || ``
  }
  else if (e.key === `ArrowDown`) {
    e.preventDefault()
    if (historyIndex.value === null)
      return
    if (historyIndex.value < inputHistory.value.length - 1) {
      historyIndex.value++
      input.value = inputHistory.value[historyIndex.value] || ``
    }
    else {
      historyIndex.value = null
      input.value = ``
    }
  }
}

async function copyToClipboard(text: string, index: number) {
  copyPlain(text)
  copiedIndex.value = index
  setTimeout(() => (copiedIndex.value = null), 1500)
}

function editMessage(content: string) {
  input.value = content
  historyIndex.value = null
  nextTick(() => {
    const textarea = document.querySelector(
      `textarea[placeholder*="说些什么" ]`,
    ) as HTMLTextAreaElement | null
    textarea?.focus()
    if (textarea) {
      const len = textarea.value.length
      textarea.setSelectionRange(len, len)
    }
  })
}

// 自定义Toast状态
const customToastVisible = ref(false)
const customToastMessage = ref(``)

// 显示自定义Toast
function showCustomToast(message: string) {
  customToastMessage.value = message
  customToastVisible.value = true
  setTimeout(() => {
    customToastVisible.value = false
  }, 2000) // 1秒后隐藏
}

function replaceSelectedText(content: string) {
  if (!store.editor) {
    console.error(`编辑器未初始化`)
    return
  }
  const cm = toRaw(store.editor)
  if (cm.getSelection().trim()) {
    // 有选中内容，替换选中内容
    cm.replaceSelection(content)
  }
  else {
    // 没有选中内容，在光标位置插入
    cm.replaceSelection(content)
  }
  cm.focus()
  showCustomToast(`内容已替换到编辑器`)
  // 关闭AI窗口
  dialogVisible.value = false
}

function insertTextAtCursor(content: string) {
  if (!store.editor) {
    console.error(`编辑器未初始化`)
    return
  }
  const cm = toRaw(store.editor)
  const cursor = cm.getCursor()
  // 在光标位置插入内容，并在前后添加换行
  cm.replaceRange(`\n${content}\n`, cursor)
  cm.focus()
  showCustomToast(`内容已插入到编辑器`)
  // 关闭AI窗口
  dialogVisible.value = false
}

function resetMessages() {
  if (fetchController.value) {
    fetchController.value.abort()
    fetchController.value = null
  }
  messages.value = getDefaultMessages()
  localStorage.setItem(memoryKey, JSON.stringify(messages.value))
  scrollToBottom(true)
}

function pauseStreaming() {
  if (fetchController.value) {
    fetchController.value.abort()
    fetchController.value = null
  }
  loading.value = false
  const last = messages.value[messages.value.length - 1]
  if (last?.role === `assistant`)
    last.done = true
  scrollToBottom(true)
}

/* ---------- 滚动控制 ---------- */
async function scrollToBottom(force = false) {
  await nextTick()
  const container = document.querySelector(`.chat-container`)
  if (container) {
    const isNearBottom = (container.scrollTop + container.clientHeight)
      >= (container.scrollHeight - 50)
    if (force || isNearBottom) {
      container.scrollTop = container.scrollHeight
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
}

/* ---------- 引用全文 ---------- */
function quoteAllContent() {
  if (isQuoteAllContent.value) {
    // 如果已激活，则取消
    isQuoteAllContent.value = false
  }
  else {
    // 激活引用全文，清除其他上下文
    // 先清除其他状态
    isQuoteCursorBefore.value = false
    isQuoteCursorMiddle.value = false
    quotedContent.value = `` // 只清除引用内容，不调用clearQuotedContent
    // 再设置当前状态
    isQuoteAllContent.value = true
  }
}

/* ---------- 过滤Markdown图片和链接 ---------- */
// 过滤掉Markdown中的图片和链接，只保留纯文本
function stripMarkdownImagesAndLinks(text: string): string {
  let result = text
  // 移除图片：![alt](url) -> 空
  result = result.replace(/!\[([^\]]*)\]\([^)]*\)/g, ``)
  // 移除链接：[text](url) -> text
  result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, `$1`)
  // 将多行空行合并成一行空行（匹配3个或更多连续换行）
  result = result.replace(/\n(?:\s*\n){2,}/g, `\n\n`)
  return result
}

// 获取过滤后的全文内容（用于UI显示）
function getFilteredFullContent(): string {
  if (!editor.value)
    return ``
  const fullContent = editor.value.getValue()
  return stripMarkdownImagesAndLinks(fullContent)
}

/* ---------- 放大查看功能 ---------- */
function openExpandedView() {
  // 根据当前激活的引用类型获取内容和标题
  if (isQuoteCursorBefore.value) {
    expandedViewTitle.value = `光标前`
    expandedViewContent.value = getCursorBeforeContent()
  }
  else if (isQuoteAllContent.value) {
    expandedViewTitle.value = `全文`
    expandedViewContent.value = getFilteredFullContent()
  }
  else if (isQuoteCursorMiddle.value) {
    expandedViewTitle.value = `光标前后上下文`
    expandedViewContent.value = `前文：${getCursorBeforeContent()}\n\n后文：${getCursorAfterContent()}`
  }
  else {
    expandedViewTitle.value = `选取的上下文`
    expandedViewContent.value = quotedContent.value
  }

  expandedViewVisible.value = true
}

function closeExpandedView() {
  expandedViewVisible.value = false
}

/* ---------- 引用光标前内容 ---------- */
function quoteCursorBefore() {
  console.log(`quoteCursorBefore函数开始，当前值:`, isQuoteCursorBefore.value)
  if (isQuoteCursorBefore.value) {
    // 如果已激活，则取消
    console.log(`取消激活`)
    isQuoteCursorBefore.value = false
  }
  else {
    // 检查光标前内容是否为空
    const cursorBeforeContent = getCursorBeforeContent()
    if (!cursorBeforeContent.trim()) {
      console.log(`光标前内容为空，不激活`)
      return
    }

    // 激活引用光标前，清除其他上下文
    console.log(`激活引用光标前`)
    // 先清除其他状态
    isQuoteAllContent.value = false
    isQuoteCursorMiddle.value = false
    quotedContent.value = `` // 只清除引用内容，不调用clearQuotedContent
    // 再设置当前状态
    isQuoteCursorBefore.value = true
  }
  console.log(`quoteCursorBefore函数结束，新值:`, isQuoteCursorBefore.value)
}

/* ---------- 引用光标中间部分 ---------- */
function quoteCursorMiddle() {
  console.log(`quoteCursorMiddle函数开始，当前值:`, isQuoteCursorMiddle.value)
  if (isQuoteCursorMiddle.value) {
    // 如果已激活，则取消
    console.log(`取消激活光标中间`)
    isQuoteCursorMiddle.value = false
  }
  else {
    // 检查光标前后是否都有内容
    const cursorBeforeContent = getCursorBeforeContent()
    const cursorAfterContent = getCursorAfterContent()
    if (!cursorBeforeContent.trim() || !cursorAfterContent.trim()) {
      console.log(`光标前后内容不完整，不激活`)
      return
    }

    // 激活引用光标中间，清除其他上下文
    console.log(`激活引用光标中间`)
    // 先清除其他状态
    isQuoteAllContent.value = false
    isQuoteCursorBefore.value = false
    quotedContent.value = `` // 只清除引用内容，不调用clearQuotedContent
    // 再设置当前状态
    isQuoteCursorMiddle.value = true
  }
  console.log(`quoteCursorMiddle函数结束，新值:`, isQuoteCursorMiddle.value)
}

function getCursorBeforeContent(): string {
  try {
    const cm: any = editor.value
    if (!cm || typeof cm.getCursor !== `function` || typeof cm.getValue !== `function`)
      return ``

    const cursor = cm.getCursor()
    if (!cursor || typeof cursor.line === `undefined` || typeof cursor.ch === `undefined`)
      return ``

    const content = cm.getValue()
    if (typeof content !== `string`)
      return ``

    const lines = content.split(`\n`)
    if (!Array.isArray(lines))
      return ``

    // 获取光标前的所有行
    const beforeLines = lines.slice(0, cursor.line)
    // 加上当前行光标前的内容
    const currentLine = lines[cursor.line] || ``
    const currentLineBefore = currentLine.substring(0, cursor.ch)

    const rawContent = [...beforeLines, currentLineBefore].join(`\n`).trim()
    // 过滤图片和链接
    return stripMarkdownImagesAndLinks(rawContent)
  }
  catch (e) {
    console.warn(`获取光标前内容失败`, e)
    return ``
  }
}

function getCursorAfterContent(): string {
  try {
    const cm: any = editor.value
    if (!cm || typeof cm.getCursor !== `function` || typeof cm.getValue !== `function`)
      return ``

    const cursor = cm.getCursor()
    if (!cursor || typeof cursor.line === `undefined` || typeof cursor.ch === `undefined`)
      return ``

    const content = cm.getValue()
    if (typeof content !== `string`)
      return ``

    const lines = content.split(`\n`)
    if (!Array.isArray(lines))
      return ``

    // 获取当前行光标后的内容
    const currentLine = lines[cursor.line] || ``
    const currentLineAfter = currentLine.substring(cursor.ch)

    // 获取光标后的所有行
    const afterLines = lines.slice(cursor.line + 1)

    const rawContent = [currentLineAfter, ...afterLines].join(`\n`).trim()
    // 过滤图片和链接
    return stripMarkdownImagesAndLinks(rawContent)
  }
  catch (e) {
    console.warn(`获取光标后内容失败`, e)
    return ``
  }
}

/* ---------- 重新生成最后一条消息 ---------- */
async function regenerateLast() {
  const lastUser = [...messages.value].reverse().find(m => m.role === `user`)
  if (!lastUser)
    return
  const idx = messages.value.findIndex((m, i, arr) =>
    i > 0 && arr[i - 1] === lastUser && m.role === `assistant`)
  if (idx !== -1)
    messages.value.splice(idx, 1)
  input.value = lastUser.content
  await nextTick()
  sendMessage()
}

/* ---------- 发送消息 ---------- */
async function sendMessage() {
  if (!input.value.trim() || loading.value)
    return

  /* 记录历史输入 */
  inputHistory.value.push(input.value.trim())
  historyIndex.value = null

  loading.value = true
  const userInput = input.value.trim()
  messages.value.push({ role: `user`, content: userInput })
  input.value = ``

  const replyMessage: ChatMessage = { role: `assistant`, content: ``, reasoning: ``, done: false }
  messages.value.push(replyMessage)
  const replyMessageProxy = messages.value[messages.value.length - 1]

  // 自动折叠上下文区域，为聊天内容腾出更多空间
  contextSectionCollapsed.value = true

  await scrollToBottom(true)

  /* 组装上下文 */
  const allHistory = messages.value
    .slice(-12)
    .filter((msg, idx, arr) =>
      !(idx === arr.length - 1 && msg.role === `assistant` && !msg.done)
      && !(idx === 0 && msg.role === `assistant`),
    )

  let contextHistory: ChatMessage[]
  if (isQuoteAllContent.value) {
    const latest: ChatMessage[] = []
    for (let i = allHistory.length - 1; i >= 0 && latest.length < 2; i--) {
      const m = allHistory[i]
      if (latest.length === 0 || m.role === `user`)
        latest.unshift(m)
      else if (m.role === `assistant`)
        latest.unshift(m)
    }
    contextHistory = latest
  }
  else {
    contextHistory = allHistory.slice(-10)
  }
  // 构建引用上下文消息
  const quoteMessages: ChatMessage[] = []

  // 如果有引用的内容，添加到上下文
  if (quotedContent.value.trim()) {
    quoteMessages.push({
      role: `user`,
      content: `请以此为上下文参考：\n\n${quotedContent.value.trim()}`,
    })
  }

  // 如果有图片素材的OCR结果，添加到上下文
  const ocrResults = imageMaterials.value
    .filter(m => m.ocrText && !m.isProcessing && !m.error)
    .map((m, index) => `图片${index + 1}（${m.file.name}）的文字内容：\n${m.ocrText}`)
    .join(`\n\n`)

  if (ocrResults) {
    quoteMessages.push({
      role: `user`,
      content: `以下是图片素材中识别的文字内容，请作为参考：\n\n${ocrResults}`,
    })
  }

  // 如果有参考文本，添加到上下文
  if (referenceText.value.trim()) {
    quoteMessages.push({
      role: `user`,
      content: `请参考以下文本内容：\n\n${referenceText.value.trim()}`,
    })
  }

  // 如果启用了引用全文，添加全文到上下文
  if (isQuoteAllContent.value) {
    const fullContent = editor.value!.getValue()
    // 过滤图片和链接
    const filteredContent = stripMarkdownImagesAndLinks(fullContent)
    quoteMessages.push({
      role: `assistant`,
      content: `\n\n${filteredContent}`,
    })
  }

  // 如果启用了引用光标前内容，添加光标前内容到上下文
  if (isQuoteCursorBefore.value) {
    const cursorBeforeContent = getCursorBeforeContent()
    if (cursorBeforeContent) {
      quoteMessages.push({
        role: `assistant`,
        content: `\n\n${cursorBeforeContent}\n\n根据以上内容续写，要接住最后一句话继续写，不要写提纲，只写内容，写成段落长文，只写本部分内容\n\n`,
      })
    }
  }

  // 如果启用了引用光标中间部分，添加光标前后内容到上下文
  if (isQuoteCursorMiddle.value) {
    const cursorBeforeContent = getCursorBeforeContent()
    const cursorAfterContent = getCursorAfterContent()
    if (cursorBeforeContent && cursorAfterContent) {
      quoteMessages.push({
        role: `assistant`,
        content: `请根据前文和后文，补充写中间的部分的内容，不要写提纲，只写内容，写成段落，一定不要跨越大纲markdown标题级别，只需要写本markdown标题级别的部分，前文内容和后文不要重复，一定要接着前文写。\n\n前文是：\n\n${cursorBeforeContent}\n\n后文是：\n\n${cursorAfterContent}\n\n`,
      })
    }
  }

  const payloadMessages: ChatMessage[] = [
    {
      role: `system`,
      content: `回复必须用Markdown格式，直接输出 Markdown 源码，一定不要包含 \`\`\`markdown 或任何代码块标记 `,
    },
    ...quoteMessages,
    ...contextHistory,
  ]

  const payload = {
    model: model.value,
    messages: payloadMessages,
    temperature: temperature.value,
    max_tokens: maxToken.value,
    stream: true,
  }
  const headers: Record<string, string> = { 'Content-Type': `application/json` }
  if (apiKey.value && type.value !== `default`) {
    // 对于 DeepSeek 使用星科代理的情况，使用 X-API-Key
    if (type.value === `deepseek` && endpoint.value.includes(`xingke888.com`)) {
      headers[`X-API-Key`] = apiKey.value
    }
    else {
      headers.Authorization = `Bearer ${apiKey.value}`
    }
  }

  fetchController.value = new AbortController()
  const signal = fetchController.value.signal

  try {
    const url = new URL(endpoint.value)
    // 对于星科代理的 DeepSeek API，endpoint 已经包含完整路径
    if (!(type.value === `deepseek` && endpoint.value.includes(`xingke888.com`))) {
      if (!url.pathname.endsWith(`/chat/completions`))
        url.pathname = url.pathname.replace(/\/?$/, `/chat/completions`)
    }
    else {
      // 星科代理需要添加 /chat 路径
      if (!url.pathname.endsWith(`/chat`))
        url.pathname = url.pathname.replace(/\/?$/, `/chat`)
    }

    const res = await window.fetch(url.toString(), {
      method: `POST`,
      headers,
      body: JSON.stringify(payload),
      signal,
    })
    if (!res.ok || !res.body)
      throw new Error(`响应错误：${res.status} ${res.statusText}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder(`utf-8`)
    let buffer = ``

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        const last = messages.value[messages.value.length - 1]
        if (last.role === `assistant`) {
          last.done = true
          await scrollToBottom(true)
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(`\n`)
      buffer = lines.pop() || ``

      for (const line of lines) {
        if (!line.trim() || line.trim() === `data: [DONE]` || line.trim() === `data:[DONE]`)
          continue
        try {
          // 支持 "data: " 和 "data:" 两种格式
          const json = JSON.parse(line.replace(/^data:\s*/, ``))
          const delta = json.choices?.[0]?.delta || {}
          const last = messages.value[messages.value.length - 1]
          if (last !== replyMessageProxy)
            return
          if (delta.content)
            last.content += delta.content
          else if (delta.reasoning_content)
            last.reasoning = (last.reasoning || ``) + delta.reasoning_content
          await scrollToBottom()
        }
        catch (e) {
          console.error(`解析失败:`, e)
        }
      }
    }
  }
  catch (e) {
    if ((e as Error).name === `AbortError`) {
      console.log(`请求中止`)
    }
    else {
      console.error(`请求失败:`, e)
      messages.value[messages.value.length - 1].content
        = `❌ 请求失败: ${(e as Error).message}`
    }
    await scrollToBottom(true)
  }
  finally {
    localStorage.setItem(memoryKey, JSON.stringify(messages.value))
    loading.value = false
    fetchController.value = null
  }
}
</script>

<template>
  <Dialog v-model:open="dialogVisible">
    <DialogContent
      class="bg-card text-card-foreground h-[98dvh] max-h-[98dvh] w-[98%] flex flex-col rounded-lg p-3 shadow-xl sm:max-h-[80vh] sm:max-w-2xl sm:rounded-xl sm:p-6"
    >
      <!-- ============ 头部 ============ -->
      <DialogHeader class="space-y-3 flex flex-col items-start pr-10">
        <div class="w-full flex items-center justify-between">
          <DialogTitle>AI写作助手</DialogTitle>

          <div class="flex items-center gap-2">
            <Button
              title="切换到图片助手"
              aria-label="切换到图片助手"
              variant="outline"
              size="sm"
              class="h-7 border-blue-200 bg-white px-3 py-0.5 text-blue-600 shadow-md transition-all dark:border-blue-800 hover:border-blue-300 dark:bg-gray-800 dark:text-blue-400 hover:shadow-lg dark:hover:border-blue-700"
              @click="switchToAIImage"
            >
              <ImagePlus class="mr-1 h-3.5 w-3.5" />
              图片助手
            </Button>
            <Button
              title="清空对话内容"
              aria-label="清空对话内容"
              variant="outline"
              size="sm"
              class="h-7 border-red-200 bg-white px-3 py-0.5 text-red-600 shadow-md transition-all dark:border-red-800 hover:border-red-300 dark:bg-gray-800 dark:text-red-400 hover:shadow-lg dark:hover:border-red-700"
              @click="resetMessages"
            >
              <Trash2 class="mr-1 h-3.5 w-3.5" />
              清空对话
            </Button>
            <Button
              title="配置参数"
              aria-label="配置参数"
              variant="outline"
              size="sm"
              class="hidden h-7 border-gray-200 bg-white px-3 py-0.5 shadow-md transition-all dark:border-gray-700 dark:bg-gray-800 hover:shadow-lg"
              @click="configVisible = !configVisible"
            >
              <Settings class="mr-1 h-3.5 w-3.5" />
              模型设置
            </Button>
          </div>
        </div>

        <!-- ============ 菜单按钮 ============ -->
        <div v-if="false" class="w-full flex items-center gap-2">
          <Button
            size="sm"
            class="h-8 flex-1 text-xs font-medium transition-all"
            :class="activeTab === 'text-edit' ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'"
            @click="switchToTextEdit"
          >
            文本编辑
          </Button>
          <Button
            size="sm"
            class="h-8 flex-1 border border-purple-300 bg-purple-50 text-xs text-purple-600 font-medium transition-all dark:border-purple-700 dark:bg-purple-900/20 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/40"
            @click="switchToAIImage"
          >
            AI作图
          </Button>
          <Button
            size="sm"
            class="h-8 flex-1 border border-green-300 bg-green-50 text-xs text-green-600 font-medium transition-all dark:border-green-700 dark:bg-green-900/20 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/40"
            @click="switchToPoster"
          >
            海报制作
          </Button>
        </div>

        <DialogDescription class="sr-only">
          AI助手对话框，用于与AI进行对话交流，帮助您编写和优化内容
        </DialogDescription>
      </DialogHeader>

      <!-- ============ 快捷指令 ============ -->
      <div
        v-if="false"
        class="mb-1 mt-3 flex flex-wrap gap-2 overflow-x-auto pb-1"
      >
        <template v-if="quickCmdStore.commands.length">
          <Button
            v-for="cmd in quickCmdStore.commands"
            :key="cmd.id"
            variant="secondary"
            size="sm"
            class="h-6 px-2 py-0.5 text-xs"
            @click="applyQuickCommand(cmd)"
          >
            {{ cmd.label }}
          </Button>
        </template>
        <template v-else>
          <div
            class="text-muted-foreground flex items-center gap-2 border rounded-md border-dashed px-3 py-1 text-xs"
          >
            还没有任何快捷指令，点击右侧添加
          </div>
        </template>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0"
          title="管理指令"
          @click="cmdMgrOpen = true"
        >
          <Plus class="h-3.5 w-3.5" />
        </Button>

        <!-- 指令管理弹窗 -->
        <QuickCommandManager v-model:open="cmdMgrOpen" />
      </div>

      <!-- ============ 参数配置面板 ============ -->
      <AIConfig
        v-if="configVisible"
        class="mb-4 w-full border rounded-md p-4"
        @saved="handleConfigSaved"
      />

      <!-- ============ 上下文区域 ============ -->
      <div v-if="!configVisible" class="from-blue-50/50 to-gray-50/50 bg-gradient-to-b dark:from-blue-900/10 dark:to-gray-800/30 border-1 border-blue-400 rounded-md dark:border-blue-600">
        <!-- 上下文标题栏（折叠控制） -->
        <div
          class="flex cursor-pointer items-center justify-between border-b bg-blue-100/40 px-3 py-2 transition-colors dark:border-gray-600 dark:bg-blue-900/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30"
          :class="contextSectionCollapsed ? 'border-transparent' : ''"
          @click="contextSectionCollapsed = !contextSectionCollapsed"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-700 font-semibold dark:text-gray-300">参考资料(写作参照上下文)</span>
            <ChevronDown v-if="contextSectionCollapsed" class="h-3.5 w-3.5 text-gray-500" />
            <ChevronUp v-else class="h-3.5 w-3.5 text-gray-500" />
          </div>

          <!-- 折叠状态摘要 -->
          <div v-if="contextSectionCollapsed" class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <template v-if="imageMaterials.length > 0 || quotedContent.trim() || isQuoteAllContent || isQuoteCursorBefore || isQuoteCursorMiddle || referenceText.trim()">
              <span v-if="imageMaterials.filter(m => m.ocrText && !m.error).length > 0" class="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {{ imageMaterials.filter(m => m.ocrText && !m.error).length }}张图片
              </span>
              <span v-if="quotedContent.trim() || isQuoteAllContent || isQuoteCursorBefore || isQuoteCursorMiddle" class="rounded bg-green-100 px-1.5 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                已选引文
              </span>
              <span v-if="referenceText.trim()" class="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                参考文本
              </span>
            </template>
            <span v-else class="text-gray-400 dark:text-gray-500">无上下文</span>
          </div>
        </div>

        <!-- 上下文内容区域（可折叠） -->
        <Transition name="context-collapse">
          <div v-show="!contextSectionCollapsed" class="bg-white/40 p-1 dark:bg-gray-900/20">
            <!-- ============ 引文选择按钮 ============ -->
            <div class="flex flex-wrap items-center gap-1 rounded-lg bg-white/60 p-1 dark:bg-gray-800/40">
              <!-- 选择上下文标签 -->
              <span class="text-xs text-gray-700 font-semibold dark:text-gray-300"><span class="text-lg">①</span>上下文:</span>
              <Button
                size="sm"
                variant="outline"
                class="h-5 flex items-center gap-0.5 rounded px-1 py-0.5 text-xs transition-colors duration-150"
                :style="quotedContent.trim() ? { backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' } : {}"
                aria-label="选取的上下文"
                :disabled="!quotedContent.trim()"
                @click="quotedContent.trim() && clearQuotedContent()"
              >
                <Check v-if="quotedContent.trim()" class="h-2.5 w-2.5" />
                <span>鼠标选区</span>
              </Button>

              <!-- 引用光标前作为上下文按钮 -->
              <Button
                size="sm"
                variant="outline"
                class="h-5 flex items-center gap-0.5 rounded px-2 py-0.5 text-xs transition-colors duration-150"
                :style="isQuoteCursorBefore ? { backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' } : {}"
                aria-label="引用光标前作为上下文"
                @click="() => { console.log('点击光标前，当前状态:', isQuoteCursorBefore); quoteCursorBefore(); nextTick(() => console.log('点击光标前后，新状态:', isQuoteCursorBefore)); }"
              >
                <Check v-if="isQuoteCursorBefore" class="h-2.5 w-2.5" />
                <span>光标前</span>
              </Button>

              <!-- 写光标中间部分按钮 -->
              <Button
                size="sm"
                variant="outline"
                class="h-5 flex items-center gap-0.5 rounded px-2 py-0.5 text-xs transition-colors duration-150"
                :style="isQuoteCursorMiddle ? { backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' } : {}"
                aria-label="写光标中间部分"
                @click="() => { console.log('点击光标中间，当前状态:', isQuoteCursorMiddle); quoteCursorMiddle(); nextTick(() => console.log('点击光标中间后，新状态:', isQuoteCursorMiddle)); }"
              >
                <Check v-if="isQuoteCursorMiddle" class="h-2.5 w-2.5" />
                <span>光标前后</span>
              </Button>

              <!-- 引用全文按钮 -->
              <Button
                size="sm"
                variant="outline"
                class="h-5 flex items-center gap-0.5 rounded px-2 py-0.5 text-xs transition-colors duration-150"
                :style="isQuoteAllContent ? { backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' } : {}"
                aria-label="引用全文作为上下文"
                @click="() => { console.log('点击全文，当前状态:', isQuoteAllContent); quoteAllContent(); nextTick(() => console.log('点击全文后，新状态:', isQuoteAllContent)); }"
              >
                <Check v-if="isQuoteAllContent" class="h-2.5 w-2.5" />
                <span>全文</span>
              </Button>
            </div>

            <!-- ============ 引用的内容 ============ -->
            <div
              v-if="quotedContent || (isQuoteCursorBefore && getCursorBeforeContent().trim()) || (isQuoteAllContent && getFilteredFullContent().trim()) || (isQuoteCursorMiddle && getCursorBeforeContent().trim() && getCursorAfterContent().trim())"
              class="relative border-1 border-green-300 rounded-sm bg-green-50/80 p-2 shadow-sm dark:border-green-700 dark:bg-green-900/30"
            >
              <div class="mb-2 pr-20 text-sm text-gray-700 font-semibold dark:text-gray-300">
                {{
                  isQuoteCursorBefore ? '光标前'
                  : isQuoteAllContent ? '全文'
                    : isQuoteCursorMiddle ? '光标前后上下文'
                      : '选取的上下文'
                }}
              </div>

              <!-- 操作按钮组 - 右上角 -->
              <div class="absolute right-2 top-2 flex gap-1">
                <!-- 放大查看按钮 -->
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 px-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="放大查看"
                  aria-label="放大查看"
                  @click="openExpandedView"
                >
                  <Maximize2 class="mr-1 h-3 w-3" />
                  放大
                </Button>
                <!-- 清除引用按钮 -->
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 px-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="清除引用"
                  aria-label="清除引用"
                  @click="clearQuotedContent"
                >
                  <X class="mr-1 h-3 w-3" />
                  清除
                </Button>
              </div>

              <div
                class="custom-scroll max-h-10 overflow-y-auto whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400"
              >
                {{
                  isQuoteCursorBefore ? getCursorBeforeContent()
                  : isQuoteAllContent ? getFilteredFullContent()
                    : isQuoteCursorMiddle ? `前文：${getCursorBeforeContent()}\n\n后文：${getCursorAfterContent()}`
                      : quotedContent
                }}
              </div>
            </div>

            <!-- ============ 图片素材区域 ============ -->
            <div class="rounded-lg bg-white/60 p-1 dark:bg-gray-800/40">
              <div class="mb-0 flex items-center justify-between">
                <span class="text-xs text-gray-700 font-semibold dark:text-gray-300"><span class="text-lg">②</span>图片素材:</span>
                <div class="flex items-center gap-2">
                  <Button
                    v-if="imageMaterials.length > 0"
                    size="sm"
                    variant="ghost"
                    class="h-5 px-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    @click="clearAllImageMaterials"
                  >
                    <X class="mr-1 h-3 w-3" />
                    清空图片
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    class="h-5 px-2 text-xs"
                    @click="selectImageMaterial"
                  >
                    <ImagePlus class="mr-1 h-3 w-3" />
                    添加图片素材
                  </Button>
                </div>
              </div>

              <!-- 图片素材列表 - 横向排列 -->
              <div v-if="imageMaterials.length > 0" class="custom-scroll flex gap-2 overflow-x-auto pb-1">
                <div
                  v-for="material in imageMaterials"
                  :key="material.id"
                  class="relative flex-shrink-0 overflow-hidden border border-gray-200 rounded-lg bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900/70"
                  style="width: 80px; height: 80px;"
                >
                  <!-- 图片预览 -->
                  <img
                    :src="material.preview"
                    :alt="material.file.name"
                    class="object-cover h-full w-full"
                  >

                  <!-- 处理中遮罩 -->
                  <div
                    v-if="material.isProcessing"
                    class="absolute inset-0 flex items-center justify-center bg-black/50"
                  >
                    <Loader2 class="animate-spin h-4 w-4 text-white" />
                  </div>

                  <!-- 错误遮罩 -->
                  <div
                    v-if="material.error"
                    class="absolute inset-0 flex items-center justify-center bg-red-500/80"
                    :title="material.error"
                  >
                    <X class="h-4 w-4 text-white" />
                  </div>

                  <!-- OCR状态指示 - 顶部 -->
                  <div
                    v-if="!material.isProcessing && !material.error"
                    class="absolute left-0 right-0 top-0 px-1 py-0.5 text-center"
                    :class="material.ocrText ? 'bg-green-500/80' : 'bg-gray-500/60'"
                  >
                    <div class="text-[10px] text-white font-medium">
                      {{ material.ocrText ? '已识别' : '无文字' }}
                    </div>
                  </div>

                  <!-- 删除按钮 -->
                  <Button
                    variant="ghost"
                    size="icon"
                    class="absolute right-0.5 top-0.5 h-5 w-5 bg-black/50 p-0.5 transition-opacity hover:bg-black/70"
                    @click="removeImageMaterial(material.id)"
                  >
                    <X class="h-3 w-3 text-white" />
                  </Button>
                </div>
              </div>

              <!-- 无图片提示 -->
              <div
                v-else
                class="flex items-center gap-2 border-2 border-gray-300 rounded-md border-dashed bg-gray-50/50 px-2 py-1.5 text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-800/30 dark:text-gray-400"
              >
                点击"添加图片素材"按钮上传图片，AI将自动识别图片中的文字作为对话参考
              </div>
            </div>

            <!-- ============ 参考文本区域 ============ -->
            <div class="rounded-lg bg-white/60 p-1.5 dark:bg-gray-800/40">
              <div class="mb-0 flex items-center justify-between">
                <span class="text-xs text-gray-700 font-semibold dark:text-gray-300"><span class="text-lg">③</span>参考文本:</span>
                <Button
                  v-if="referenceText.trim()"
                  size="sm"
                  variant="ghost"
                  class="h-5 px-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  @click="referenceText = ''"
                >
                  <X class="mr-1 h-3 w-3" />
                  清空文本
                </Button>
              </div>

              <!-- 参考文本输入框 -->
              <Textarea
                v-model="referenceText"
                placeholder="粘贴参考文本，作为对话参考..."
                rows="1"
                class="custom-scroll min-h-12 w-full resize-none border border-gray-200 rounded-md bg-white px-1 py-1 text-sm"
              />
            </div>
          </div>
        </Transition>
      </div>

      <!-- ============ 聊天内容 ============ -->
      <div
        v-if="!configVisible"
        class="custom-scroll space-y-3 chat-container mb-4 flex-1 overflow-y-auto pr-2"
      >
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="relative flex"
          :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="ring-border/20 rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ring-1"
            :class="[
              msg.role === 'user'
                ? 'bg-green-100 text-gray-800 dark:bg-green-900/50 dark:text-green-100 max-w-[85%]'
                : 'bg-gray-100 text-gray-800 dark:bg-muted/60 dark:text-muted-foreground max-w-[100%]',
            ]"
          >
            <!-- reasoning -->
            <div v-if="msg.reasoning" class="text-muted-foreground mb-1 italic">
              {{ msg.reasoning }}
            </div>

            <!-- Markdown 内容 -->
            <div
              class="whitespace-pre-wrap"
              :class="msg.content ? '' : 'animate-pulse text-muted-foreground'"
            >
              {{
                msg.content
                  || (msg.role === 'assistant' && !msg.done ? '思考中…' : '')
              }}
            </div>

            <!-- 工具按钮 -->
            <div
              class="mt-2 flex flex-wrap gap-1"
              :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <!-- 复制按钮 -->
              <Button
                v-if="index > 0 && !(msg.role === 'assistant' && index === messages.length - 1 && !msg.done)"
                variant="ghost"
                size="icon"
                class="h-6 w-6 p-1"
                aria-label="复制内容"
                @click="copyToClipboard(msg.content, index)"
              >
                <Check
                  v-if="copiedIndex === index"
                  class="h-4 w-4 text-green-600"
                />
                <Copy v-else class="text-muted-foreground h-4 w-4" />
              </Button>

              <!-- 编辑按钮 -->
              <Button
                v-if="index > 0 && !(msg.role === 'assistant' && index === messages.length - 1 && !msg.done)"
                variant="ghost"
                size="icon"
                class="h-6 w-6 p-1"
                aria-label="编辑内容"
                @click="editMessage(msg.content)"
              >
                <Edit class="text-muted-foreground h-4 w-4" />
              </Button>

              <!-- 重新生成按钮 -->
              <Button
                v-if="msg.role === 'assistant' && msg.done && index === messages.length - 1"
                variant="ghost"
                size="icon"
                class="h-6 w-6 p-1"
                aria-label="重新生成"
                @click="regenerateLast"
              >
                <RefreshCcw class="text-muted-foreground h-4 w-4" />
              </Button>

              <!-- AI回复专用：替换和插入按钮 -->
              <template v-if="msg.role === 'assistant' && msg.done && msg.content.trim()">
                <Button
                  variant="outline"
                  size="sm"
                  class="h-6 px-2 text-xs"
                  aria-label="替换到编辑器"
                  @click="replaceSelectedText(msg.content)"
                >
                  <Replace class="mr-1 h-3 w-3" />
                  替换
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-6 px-2 text-xs"
                  aria-label="插入到编辑器"
                  @click="insertTextAtCursor(msg.content)"
                >
                  <ArrowDown class="mr-1 h-3 w-3" />
                  插入
                </Button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ 输入框 ============ -->
      <div v-if="!configVisible" class="relative mt-2">
        <div
          class="bg-gradient-to-br from-blue-50 item-start to-white dark:from-blue-950/30 dark:to-gray-900 flex flex-col items-baseline gap-2 border-1 border-blue-300 rounded-md px-3 py-2 pr-12 shadow-lg transition-all duration-200 dark:border-blue-700 focus-within:border-blue-500 focus-within:shadow-sm focus-within:ring-1 focus-within:ring-blue-300/50 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-700/50"
        >
          <Textarea
            v-model="input"
            placeholder="请输入写作要求… (Enter 发送，Shift+Enter 换行)"
            rows="2"
            class="custom-scroll min-h-16 w-full resize-none border-none bg-transparent p-0 focus-visible:outline-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:ring-offset-0 focus-visible:ring-transparent focus:ring-transparent"
            @keydown="handleKeydown"
          />

          <!-- 发送 / 暂停按钮 -->
          <Button
            :disabled="!input.trim() && !loading"
            size="icon"
            class="hover:bg-primary/90 bg-primary text-primary-foreground absolute bottom-3 right-3 rounded-full disabled:opacity-40"
            :aria-label="loading ? '暂停' : '发送'"
            @click="loading ? pauseStreaming() : sendMessage()"
          >
            <Pause v-if="loading" class="h-4 w-4" />
            <Send v-else class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- 自定义Toast -->
  <Transition name="toast-fade">
    <div
      v-if="customToastVisible"
      class="backdrop-blur-sm fixed left-1/2 top-1/2 z-[100] transform rounded-lg bg-green-600/90 px-4 py-2 text-sm text-white font-medium -translate-x-1/2 -translate-y-1/2"
    >
      {{ customToastMessage }}
    </div>
  </Transition>

  <!-- 放大查看对话框 -->
  <Dialog v-model:open="expandedViewVisible">
    <DialogContent class="h-[90vh] max-w-3xl w-[90vw] flex flex-col">
      <DialogHeader>
        <DialogTitle>{{ expandedViewTitle }}</DialogTitle>
        <DialogDescription class="sr-only">
          放大查看引用内容
        </DialogDescription>
      </DialogHeader>
      <div class="custom-scroll flex-1 overflow-y-auto whitespace-pre-wrap border rounded-lg bg-gray-50 p-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200">
        {{ expandedViewContent }}
      </div>
      <div class="flex justify-end gap-2 pt-4">
        <Button variant="outline" @click="closeExpandedView">
          关闭
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- 海报制作对话框 -->
  <PosterGeneratorDialog v-model:open="posterDialogVisible" />

  <!-- Hidden file input for image material selection -->
  <input
    ref="imageFileInput"
    type="file"
    accept="image/*"
    multiple
    class="hidden"
    @change="handleImageSelect"
  >
</template>

<style scoped>
:root {
  --safe-bottom: env(safe-area-inset-bottom);
}

/* 自定义Toast动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition:
    opacity 0.2s ease-in-out,
    transform 0.2s ease-in-out;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

.toast-fade-enter-to,
.toast-fade-leave-from {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

/* 聊天容器底部内边距，适配安全区 */
.chat-container {
  padding-bottom: calc(1rem + var(--safe-bottom));
}

/* 让代码块可横向滚动 */
.chat-container pre {
  overflow-x: auto;
}

/* highlight.js 暗黑主题适配 */
.dark .hljs {
  background: #0d1117 !important;
  color: #c9d1d9 !important;
}

.chat-markdown > * + * {
  margin-top: 0.5rem; /* 8 px */
}

/* 让代码块更紧凑一点，同时保留主题自带颜色 */
.chat-markdown pre {
  padding: 0.75rem; /* 内边距 */
  border-radius: 0.375rem; /* 圆角 */
  overflow-x: auto; /* 横向滚动 */
}

/* 自定义滚动条 */
@media (pointer: coarse) {
  .custom-scroll::-webkit-scrollbar {
    width: 3px;
  }
}
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  @apply rounded-full bg-gray-400/40 hover:bg-gray-400/60;
  @apply dark:bg-gray-500/40 dark:hover:bg-gray-500/70;
}
.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgb(156 163 175 / 0.4) transparent;
}
.dark .custom-scroll {
  scrollbar-color: rgb(107 114 128 / 0.4) transparent;
}

/* 隐藏AIAssistantPanel组件内的文本选择高亮和选择角标 */
.bg-card ::selection {
  background: transparent !important;
}

.bg-card ::-moz-selection {
  background: transparent !important;
}

/* 隐藏选择角标 */
.bg-card {
  user-select: none;
}

/* 但允许输入框可以选择 */
.bg-card textarea,
.bg-card input {
  user-select: text;
}

/* 上下文区域折叠动画 */
.context-collapse-enter-active,
.context-collapse-leave-active {
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

.context-collapse-enter-from,
.context-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.context-collapse-enter-to,
.context-collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
  transform: translateY(0);
}
</style>
