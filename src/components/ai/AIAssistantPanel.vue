<script setup lang="ts">
import {
  ArrowDown,
  Check,
  Copy,
  Edit,
  Pause,
  Plus,
  RefreshCcw,
  Replace,
  Send,
  Settings,
  Trash2,
  X,
} from 'lucide-vue-next'
import { nextTick, ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useDisplayStore } from '@/stores'
import useAIConfigStore from '@/stores/AIConfig'
import type { QuickCommandRuntime } from '@/stores/useQuickCommands'
import { useQuickCommands } from '@/stores/useQuickCommands'
import { copyPlain } from '@/utils/clipboard'
import PosterGeneratorDialog from '@/components/ai/PosterGeneratorDialog.vue'

/* ---------- 组件属性 ---------- */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits([`update:open`])

const store = useStore()
const { editor } = storeToRefs(store)
const displayStore = useDisplayStore()
const { toggleAIImageDialog } = displayStore

/* ---------- 菜单选项卡 ---------- */
const activeTab = ref(`text-edit`)
const posterDialogVisible = ref(false)

function handleTabChange(value: string | number) {
  const tabValue = String(value)
  if (tabValue === `ai-image`) {
    // 切换到AI文生图
    dialogVisible.value = false
    setTimeout(() => toggleAIImageDialog(true), 100)
  }
  else if (tabValue === `poster`) {
    // 打开海报制作对话框
    posterDialogVisible.value = true
  }
  else {
    activeTab.value = tabValue
  }
}

/* ---------- 弹窗开关 ---------- */
const dialogVisible = ref(props.open)
watch(() => props.open, val => (dialogVisible.value = val))
watch(dialogVisible, (val) => {
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

    return [...beforeLines, currentLineBefore].join(`\n`).trim()
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

    return [currentLineAfter, ...afterLines].join(`\n`).trim()
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

  // 如果启用了引用全文，添加全文到上下文
  if (isQuoteAllContent.value) {
    quoteMessages.push({
      role: `assistant`,
      content: `\n\n${editor.value!.getValue()}`,
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
  if (apiKey.value && type.value !== `default`)
    headers.Authorization = `Bearer ${apiKey.value}`

  fetchController.value = new AbortController()
  const signal = fetchController.value.signal

  try {
    const url = new URL(endpoint.value)
    if (!url.pathname.endsWith(`/chat/completions`))
      url.pathname = url.pathname.replace(/\/?$/, `/chat/completions`)

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
        if (!line.trim() || line.trim() === `data: [DONE]`)
          continue
        try {
          const json = JSON.parse(line.replace(/^data: /, ``))
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
      class="bg-card text-card-foreground h-dvh max-h-dvh w-full flex flex-col rounded-none shadow-xl sm:max-h-[80vh] sm:max-w-2xl sm:rounded-xl"
    >
      <!-- ============ 头部 ============ -->
      <DialogHeader class="space-y-3 flex flex-col items-start">
        <div class="w-full flex items-center justify-between">
          <DialogTitle>AI助手</DialogTitle>

          <div class="flex items-center gap-1">
            <Button
              title="清空对话内容"
              aria-label="清空对话内容"
              variant="ghost"
              size="sm"
              class="px-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              @click="resetMessages"
            >
              <Trash2 class="mr-1 h-4 w-4" />
              清空对话
            </Button>
            <Button
              title="配置参数"
              aria-label="配置参数"
              variant="ghost"
              size="icon"
              @click="configVisible = !configVisible"
            >
              <Settings class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- ============ 菜单选项卡 ============ -->
        <Tabs :model-value="activeTab" class="w-full" @update:model-value="handleTabChange">
          <TabsList class="grid h-9 w-full grid-cols-3 bg-gray-100 p-1 dark:bg-gray-800">
            <TabsTrigger
              value="text-edit"
              class="flex h-7 items-center justify-center data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <span class="text-xs font-medium">文本编辑</span>
            </TabsTrigger>
            <TabsTrigger
              value="ai-image"
              class="flex h-7 items-center justify-center data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <span class="text-xs font-medium">AI文生图</span>
            </TabsTrigger>
            <TabsTrigger
              value="poster"
              class="flex h-7 items-center justify-center data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <span class="text-xs font-medium">海报制作</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <DialogDescription class="sr-only">
          AI助手对话框，用于与AI进行对话交流，帮助您编写和优化内容
        </DialogDescription>
      </DialogHeader>

      <!-- ============ 快捷指令 ============ -->
      <div
        v-if="!configVisible"
        class="mb-1 flex flex-wrap gap-2 overflow-x-auto pb-1"
      >
        <template v-if="quickCmdStore.commands.length">
          <Button
            v-for="cmd in quickCmdStore.commands"
            :key="cmd.id"
            variant="secondary"
            size="sm"
            class="text-xs"
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
          size="icon"
          title="管理指令"
          @click="cmdMgrOpen = true"
        >
          <Plus class="h-4 w-4" />
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

      <!-- ============ 上下文选择按钮 ============ -->
      <div v-if="!configVisible" class="mb-3 flex flex-wrap items-center gap-2">
        <!-- 选择上下文标签 -->
        <span class="text-sm text-gray-700 font-medium dark:text-gray-300">上下文引用:</span>
        <Button
          size="sm"
          variant="outline"
          class="h-8 flex items-center gap-1 rounded-md px-3 font-medium transition-colors duration-150"
          :style="quotedContent.trim() ? { backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' } : {}"
          aria-label="选取的上下文"
          :disabled="!quotedContent.trim()"
          @click="quotedContent.trim() && clearQuotedContent()"
        >
          <Check v-if="quotedContent.trim()" class="h-4 w-4" />
          <span class="text-xs">鼠标选取</span>
        </Button>

        <!-- 引用光标前作为上下文按钮 -->
        <Button
          size="sm"
          variant="outline"
          class="h-8 flex items-center gap-1 rounded-md px-3 font-medium transition-colors duration-150"
          :style="isQuoteCursorBefore ? { backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' } : {}"
          aria-label="引用光标前作为上下文"
          @click="() => { console.log('点击光标前，当前状态:', isQuoteCursorBefore); quoteCursorBefore(); nextTick(() => console.log('点击光标前后，新状态:', isQuoteCursorBefore)); }"
        >
          <Check v-if="isQuoteCursorBefore" class="h-4 w-4" />
          <span class="text-xs">光标前全文</span>
        </Button>

        <!-- 写光标中间部分按钮 -->
        <Button
          size="sm"
          variant="outline"
          class="h-8 flex items-center gap-1 rounded-md px-3 font-medium transition-colors duration-150"
          :style="isQuoteCursorMiddle ? { backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' } : {}"
          aria-label="写光标中间部分"
          @click="() => { console.log('点击光标中间，当前状态:', isQuoteCursorMiddle); quoteCursorMiddle(); nextTick(() => console.log('点击光标中间后，新状态:', isQuoteCursorMiddle)); }"
        >
          <Check v-if="isQuoteCursorMiddle" class="h-4 w-4" />
          <span class="text-xs">写光标中间</span>
        </Button>

        <!-- 引用全文按钮 -->
        <Button
          size="sm"
          variant="outline"
          class="h-8 flex items-center gap-1 rounded-md px-3 font-medium transition-colors duration-150"
          :style="isQuoteAllContent ? { backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' } : {}"
          aria-label="引用全文作为上下文"
          @click="() => { console.log('点击全文，当前状态:', isQuoteAllContent); quoteAllContent(); nextTick(() => console.log('点击全文后，新状态:', isQuoteAllContent)); }"
        >
          <Check v-if="isQuoteAllContent" class="h-4 w-4" />
          <span class="text-xs">全文</span>
        </Button>
      </div>

      <!-- ============ 引用的内容 ============ -->
      <div
        v-if="!configVisible && (quotedContent || (isQuoteCursorBefore && getCursorBeforeContent().trim()) || isQuoteAllContent || (isQuoteCursorMiddle && getCursorBeforeContent().trim() && getCursorAfterContent().trim()))"
        class="relative mb-1 border rounded-lg p-3"
        :class="isQuoteCursorBefore ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800/50'"
      >
        <div class="mb-2 pr-20 text-sm text-gray-700 font-semibold dark:text-gray-300">
          {{
            isQuoteCursorBefore ? '光标前全文'
            : isQuoteAllContent ? '全文'
              : isQuoteCursorMiddle ? '光标前后上下文'
                : '选取的上下文'
          }}
        </div>

        <!-- 清除引用按钮 - 右上角 -->
        <Button
          variant="ghost"
          size="sm"
          class="absolute right-2 top-2 h-6 px-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-700"
          title="清除引用"
          aria-label="清除引用"
          @click="clearQuotedContent"
        >
          <X class="mr-1 h-3 w-3" />
          清除选取的上下文
        </Button>

        <div
          class="custom-scroll max-h-16 overflow-y-auto whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400"
        >
          {{
            isQuoteCursorBefore ? getCursorBeforeContent()
            : isQuoteAllContent ? (editor?.getValue() || '')
              : isQuoteCursorMiddle ? `前文：${getCursorBeforeContent()}\n\n后文：${getCursorAfterContent()}`
                : quotedContent
          }}
        </div>
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
                ? 'bg-green-100 text-gray-800 dark:bg-green-900/50 dark:text-green-100 max-w-[65%]'
                : 'bg-gray-100 text-gray-800 dark:bg-muted/60 dark:text-muted-foreground max-w-[85%]',
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
          class="bg-background border-border item-start flex flex-col items-baseline gap-2 border rounded-xl px-3 py-2 pr-12 shadow-inner"
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

  <!-- 海报制作对话框 -->
  <PosterGeneratorDialog v-model:open="posterDialogVisible" />
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
</style>
