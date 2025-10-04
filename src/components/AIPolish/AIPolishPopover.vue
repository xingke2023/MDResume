<script setup lang="ts">
import { Pause, Settings, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import useAIConfigStore from '@/stores/AIConfig'

/* -------------------- props / emits -------------------- */
const props = defineProps<{
  position: { top: number, left: number }
  selectedText: string
  isDragging: boolean
  isMobile: boolean
}>()
const emit = defineEmits([`closeBtn`, `recalcPos`, `startDrag`])

/* -------------------- reactive state -------------------- */
const configVisible = ref(false)
const visible = ref(false)
const message = ref(``)
const loading = ref(false)
const abortController = ref<AbortController | null>(null)
const customPromptText = ref(``)
const hasResult = ref(false)
const selectedAction = ref<
  `optimize` | `summarize` | `spellcheck` | `translate-zh` | `translate-en` | `custom`
>(`custom`)
const currentText = ref(``)
const error = ref(``)

/* -------------------- store & refs -------------------- */
const store = useStore()
const resultContainer = ref<HTMLElement | null>(null)

/* -------------------- AI config -------------------- */
const AIConfigStore = useAIConfigStore()
const { apiKey, endpoint, model, temperature, maxToken, type }
  = storeToRefs(AIConfigStore)

/* -------------------- action options -------------------- */
interface ActionOption {
  value: string
  label: string
  defaultPrompt: string
}

const actionOptions: ActionOption[] = [
  { value: `custom`, label: `自定义提示词`, defaultPrompt: `` },
  {
    value: `optimize`,
    label: `优化文本`,
    defaultPrompt: `请优化文本，使其更通顺易读。`,
  },
  {
    value: `summarize`,
    label: `文章总结`,
    defaultPrompt: `请对文本进行摘要，输出主要观点和结论。`,
  },
  {
    value: `spellcheck`,
    label: `错别字纠正`,
    defaultPrompt: `请找出并纠正文本中的错别字、标点和语法错误。`,
  },
  {
    value: `translate-zh`,
    label: `翻译为中文`,
    defaultPrompt: `请将文本翻译为地道的中文。`,
  },
  {
    value: `translate-en`,
    label: `翻译为英文`,
    defaultPrompt: `请将文本翻译为自然流畅的英文。`,
  },
]

/* -------------------- watchers -------------------- */
watch(message, async () => {
  emit(`recalcPos`)
  await nextTick()
  resultContainer.value?.scrollTo({ top: resultContainer.value.scrollHeight })
})

watch(selectedAction, (val) => {
  if (val !== `custom`) {
    customPromptText.value = ``
  }
})

// 当 visible 且 props.selectedText 变更时，更新原文并重置状态
watch(
  () => props.selectedText,
  (val) => {
    if (visible.value) {
      currentText.value = val
      resetState()
    }
  },
)

/* -------------------- prompt handlers -------------------- */

function resetState() {
  message.value = ``
  loading.value = false
  hasResult.value = false
  error.value = ``

  abortController.value?.abort()
  abortController.value = null
}

/* -------------------- AI call -------------------- */
async function runAIAction() {
  const text = currentText.value.trim()
  if (!text || loading.value)
    return

  resetState()
  loading.value = true
  abortController.value = new AbortController()

  const systemPrompt
    = `请根据用户的指令处理下列内容。在输出时，只输出处理后的文本。`
  const picked = actionOptions.find(o => o.value === selectedAction.value)!
  const parts: string[] = []

  if (picked.defaultPrompt) {
    parts.push(picked.defaultPrompt)
  }
  else if (selectedAction.value === `custom` && customPromptText.value.trim()) {
    // 对于自定义选项，直接使用文本框中的内容作为prompt
    parts.push(customPromptText.value.trim())
  }
  else if (selectedAction.value === `custom` && !customPromptText.value.trim()) {
    // 如果是自定义但没有输入内容，使用默认提示
    parts.push(`请根据最佳实践优化文本。`)
  }

  // 如果非自定义选项且没有默认提示词，使用兜底提示
  if (!parts.length) {
    parts.push(`请根据最佳实践优化文本。`)
  }

  const userCommand = parts.join(` `)

  // 构建消息数组，包含引用的上下文
  const messages = [
    { role: `system`, content: systemPrompt },
  ]

  // 如果有引用的上下文内容，添加到消息中
  if (currentText.value && currentText.value.trim()) {
    messages.push({
      role: `system`,
      content: `以下是引用的上下文内容，请以此为参考：\n\n${currentText.value.trim()}`,
    })
  }

  messages.push({
    role: `user`,
    content: `${userCommand}\n\n待处理文本：\n${text}`,
  })

  const payload = {
    model: model.value,
    messages,
    temperature: temperature.value,
    max_tokens: maxToken.value,
    stream: true,
  }

  const headers: Record<string, string> = {
    'Content-Type': `application/json`,
  }
  if (apiKey.value && type.value !== `default`) {
    headers.Authorization = `Bearer ${apiKey.value}`
  }

  try {
    const url = new URL(endpoint.value)
    if (!url.pathname.endsWith(`/chat/completions`)) {
      url.pathname = url.pathname.replace(/\/?$/, `/chat/completions`)
    }

    const res = await window.fetch(url.toString(), {
      method: `POST`,
      headers,
      body: JSON.stringify(payload),
      signal: abortController.value!.signal,
    })

    if (!res.ok || !res.body)
      throw new Error(`响应错误：${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder(`utf-8`)
    let buffer = ``

    while (true) {
      const { value, done } = await reader.read()
      if (done)
        break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(`\n`)
      buffer = lines.pop() || ``

      for (const line of lines) {
        if (!line.trim() || line.trim() === `data: [DONE]`)
          continue
        try {
          const json = JSON.parse(line.replace(/^data: /, ``))
          const delta = json.choices?.[0]?.delta?.content
          if (delta?.trim()) {
            message.value += delta
            hasResult.value = true
          }
        }
        catch {}
      }
    }
  }
  catch (e: any) {
    if (e.name === `AbortError`) {
      console.log(`Request aborted by user.`)
    }
    else {
      console.error(`请求失败：`, e)
      error.value = e.message || `请求失败`
    }
  }
  finally {
    loading.value = false
  }
}

/* -------------------- abort handler -------------------- */
function stopAI() {
  if (loading.value && abortController.value) {
    abortController.value.abort()
    loading.value = false
  }
}

/* -------------------- actions -------------------- */
function replaceText() {
  const cm = toRaw(store.editor!)!
  const start = cm.getCursor(`start`)
  cm.replaceSelection(message.value)
  const end = cm.getCursor(`end`)
  cm.setSelection(start, end)
  cm.focus()

  currentText.value = message.value
  resetState()
}

function insertText() {
  const cm = toRaw(store.editor!)!
  const cursor = cm.getCursor(`end`) // 获取选区结束位置
  const line = cursor.line

  // 在下一行插入AI生成的内容
  cm.replaceRange(`\n${message.value}`, cursor)

  // 选中插入的内容（不包括换行符）
  const insertStart = { line: line + 1, ch: 0 }
  const insertEnd = { line: line + 1, ch: message.value.length }
  cm.setSelection(insertStart, insertEnd)
  cm.focus()

  resetState()
}

function show() {
  emit(`closeBtn`)

  // 重新获取当前编辑器中选中的文字
  const currentSelection = store.editor?.getSelection()?.trim() || ``

  if (!currentSelection) {
    toast.error(`请选择需要处理的内容`)
    return
  }

  visible.value = true
  currentText.value = currentSelection
  emit(`recalcPos`)
}

function close() {
  visible.value = false
  customPromptText.value = ``
  selectedAction.value = `custom`
  resetState()
}

defineExpose({ visible, runAIAction, replaceText, insertText, show, close, stopAI })
</script>

<template>
  <Transition name="fade-scale">
    <div
      v-if="visible"
      class="bg-card border-border text-card-foreground fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[90vw] flex flex-col overflow-hidden border rounded-xl shadow-2xl sm:w-[460px] -translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0"
      :style="props.isMobile ? {} : { left: `${position.left}px`, top: `${position.top}px`, transformOrigin: 'top left' }"
    >
      <!-- header -->
      <div
        class="border-border popover-header flex select-none items-center justify-between border-b px-4 pb-2 pt-3 sm:cursor-move sm:px-6"
        @mousedown="!props.isMobile && emit('startDrag', $event)"
      >
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold">AI 工具箱</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="配置"
            @click="configVisible = !configVisible"
          >
            <Settings class="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" aria-label="关闭" @click="close">
          <X class="h-3 w-3" />
        </Button>
      </div>

      <!-- config panel -->
      <AIConfig
        v-if="configVisible"
        class="border-border mb-4 w-full border rounded-md p-4"
        @saved="() => (configVisible = false)"
      />

      <!-- main content -->
      <section v-else class="space-y-3 custom-scroll flex-1 overflow-y-auto px-4 pb-2 pt-3 sm:px-6">
        <!-- original text -->
        <div>
          <div class="mb-1 text-sm font-semibold">
            引用的上下文
          </div>
          <div
            class="custom-scroll text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-line rounded bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800/50"
          >
            {{ currentText }}
          </div>
        </div>

        <!-- action selector -->
        <div>
          <div class="mb-1 text-sm font-semibold">
            选择操作
          </div>
          <Select v-model="selectedAction">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="请选择要执行的操作" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="opt in actionOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <!-- custom prompts -->
        <div v-if="selectedAction === 'custom'">
          <div class="mb-1 text-sm font-semibold">
            请输入提示词
          </div>

          <!-- 多行文本输入框 -->
          <div class="mb-3">
            <Textarea
              v-model="customPromptText"
              class="min-h-[60px] resize-none"
              placeholder="请输入你的要求，点击AI处理即可开始处理...
例如：
- 将这段文字改写为更正式的语调
- 翻译成英文并保持原意
- 提取关键信息并总结"
            />
            <!-- <div class="text-muted-foreground mt-2 text-xs">
              💡 提示：直接在上方输入框中写下你的要求，点击"AI 处理"即可开始处理
            </div> -->
          </div>
        </div>

        <!-- error -->
        <div v-if="error" class="min-h-[24px] flex items-center text-[12px] text-red-500">
          {{ error }}
        </div>

        <!-- result -->
        <div v-if="message">
          <div class="mb-1 text-sm font-semibold">
            处理结果
          </div>
          <div
            ref="resultContainer"
            class="custom-scroll border-border bg-background max-h-40 min-h-[60px] overflow-y-auto whitespace-pre-line border rounded px-3 py-2 text-sm"
          >
            {{ message }}
          </div>
        </div>

        <!-- footer buttons -->
        <div class="flex justify-end gap-2 px-6 pb-3 pt-2">
          <Button v-if="loading" variant="secondary" @click="stopAI">
            <Pause class="mr-1 h-4 w-4" /> 终止
          </Button>
          <Button
            v-if="hasResult && !loading"
            variant="default"
            @click="replaceText"
          >
            替换
          </Button>
          <Button
            v-if="hasResult && !loading"
            variant="outline"
            @click="insertText"
          >
            插入
          </Button>
          <Button
            v-if="!loading"
            variant="outline"
            :disabled="!hasResult && !!message"
            @click="runAIAction"
          >
            {{ hasResult ? '重试' : 'AI 处理' }}
          </Button>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.fade-scale-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-scale-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  --tw-scale-x: 0.95;
  --tw-scale-y: 0.95;
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
}

.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  /* Tailwind @apply in <style> needs explicit classes when using <style scoped> */
  background-color: rgba(156, 163, 175, 0.4);
  border-radius: 9999px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.6);
}
.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
}
:deep(.dark) .custom-scroll {
  scrollbar-color: rgba(107, 114, 128, 0.4) transparent;
}

.popover-header {
  cursor: move;
  user-select: none;
}

@media (pointer: coarse) {
  .custom-scroll::-webkit-scrollbar {
    width: 3px;
  }
}
</style>
