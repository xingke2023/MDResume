<script setup lang="ts">
import { useClipboard, useStorage } from '@vueuse/core'
import {
  Bold,
  BookOpen,
  Calendar,
  ChartPie,
  Code,
  CreditCard,
  FileX2,
  Gem,
  Heading,
  ImagePlus,
  Indent,
  Link,
  List,
  ListOrdered,
  Minus,
  MinusSquare,
  Newspaper,
  Pencil,
  Quote,
  Redo,
  Settings,
  Sparkles,
  Strikethrough,
  Table,
  Trash2,
  Undo,
  Wand2,
  Wrench,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { nextTick, ref, toRaw } from 'vue'
import { toast } from 'vue-sonner'
import BeautifyDialog from '@/components/ai/BeautifyDialog.vue'
import IndustryHotspotDialog from '@/components/ai/IndustryHotspotDialog.vue'
import NanoBananaDialog from '@/components/ai/NanoBananaDialog.vue'
import PosterGeneratorDialog from '@/components/ai/PosterGeneratorDialog.vue'
import WritingPlanDialog from '@/components/ai/WritingPlanDialog.vue'
import { ctrlKey, themeOptions } from '@/config'
import { useDisplayStore, useStore } from '@/stores'
import useAIConfigStore from '@/stores/AIConfig'
import { addPrefix, processClipboardContent } from '@/utils'
import FetchArticleDialog from './FetchArticleDialog.vue'
import RewriteDialog from './RewriteDialog.vue'
import MpConfigDialog from './WechatPublish/MpConfigDialog.vue'
import PublishDialog from './WechatPublish/PublishDialog.vue'

const emit = defineEmits([`startCopy`, `endCopy`, `switchToEditor`])

const store = useStore()
const displayStore = useDisplayStore()
const aiConfigStore = useAIConfigStore()

const {
  isDark,
  output,
  primaryColor,
  isOpenPresetPanel,
  editor,
  theme,
  isMobile,
  isShowMobileToolbar,
} = storeToRefs(store)

const {
  toggleDark,
  editorRefresh,
  formatContent,
  themeChanged,
  undo,
  redo,
} = store

// 插入标题
function insertHeading(level: number) {
  if (!editor.value)
    return

  const editorInstance = toRaw(editor.value)
  const cursor = editorInstance.getCursor()
  const line = editorInstance.getLine(cursor.line)

  // 生成对应级别的标题前缀
  const prefix = `${`#`.repeat(level)} `

  // 如果当前行为空，直接插入标题前缀
  if (!line.trim()) {
    editorInstance.replaceRange(prefix, cursor)
    editorInstance.setCursor({ line: cursor.line, ch: prefix.length })
  }
  // 如果当前行已经是标题，替换标题级别
  else if (line.match(/^#+\s/)) {
    const newLine = line.replace(/^#+\s/, prefix)
    editorInstance.replaceRange(
      newLine,
      { line: cursor.line, ch: 0 },
      { line: cursor.line, ch: line.length },
    )
  }
  // 否则在行首添加标题前缀
  else {
    editorInstance.replaceRange(prefix, { line: cursor.line, ch: 0 })
    editorInstance.setCursor({ line: cursor.line, ch: cursor.ch + prefix.length })
  }

  // 延迟设置焦点，确保下拉菜单完全关闭
  setTimeout(() => {
    editorInstance.focus()
  }, 300)
}

// 插入分割线
function insertDivider() {
  if (!editor.value)
    return
  const editorInstance = toRaw(editor.value)
  const cursor = editorInstance.getCursor()
  editorInstance.replaceRange(`\n---\n`, cursor)
  editorInstance.setCursor({ line: cursor.line + 2, ch: 0 })
  setTimeout(() => editorInstance.focus(), 100)
}

// 插入引用
function insertQuote() {
  if (!editor.value)
    return
  const editorInstance = toRaw(editor.value)
  const selection = editorInstance.getSelection()
  const cursor = editorInstance.getCursor()

  if (selection) {
    // 有选中文本，为每行添加引用符号
    const lines = selection.split(`\n`)
    const quoted = lines.map(line => `> ${line}`).join(`\n`)
    editorInstance.replaceSelection(quoted)
  }
  else {
    // 无选中文本，插入引用前缀
    const line = editorInstance.getLine(cursor.line)
    if (line.startsWith(`> `)) {
      // 如果已经是引用，移除引用符号
      editorInstance.replaceRange(
        line.substring(2),
        { line: cursor.line, ch: 0 },
        { line: cursor.line, ch: line.length },
      )
    }
    else {
      // 添加引用符号
      editorInstance.replaceRange(`> `, { line: cursor.line, ch: 0 })
      editorInstance.setCursor({ line: cursor.line, ch: cursor.ch + 2 })
    }
  }
  setTimeout(() => editorInstance.focus(), 100)
}

// 段落首行缩进
function insertIndent() {
  if (!editor.value)
    return
  const editorInstance = toRaw(editor.value)
  const cursor = editorInstance.getCursor()
  editorInstance.replaceRange(`　　`, cursor) // 两个全角空格
  editorInstance.setCursor({ line: cursor.line, ch: cursor.ch + 2 })
  setTimeout(() => editorInstance.focus(), 100)
}

// 删除当前行
function deleteLine() {
  if (!editor.value)
    return
  const editorInstance = toRaw(editor.value)
  const cursor = editorInstance.getCursor()
  const line = cursor.line
  editorInstance.replaceRange(
    ``,
    { line, ch: 0 },
    { line: line + 1, ch: 0 },
  )
  setTimeout(() => editorInstance.focus(), 100)
}

// 清空编辑器
function clearEditor() {
  if (!editor.value)
    return
  // eslint-disable-next-line no-alert
  if (window.confirm(`确定要清空编辑器内容吗？`)) {
    const editorInstance = toRaw(editor.value)
    editorInstance.setValue(``)
    setTimeout(() => editorInstance.focus(), 100)
  }
}

// 工具函数，添加格式
function addFormat(cmd: string) {
  if (!editor.value)
    return

  const editorInstance = editor.value

  // 定义格式符号映射
  const formatMap: Record<string, { before: string, after: string, offset: number }> = {
    [`${ctrlKey}-B`]: { before: `**`, after: `**`, offset: 2 }, // 加粗
    [`${ctrlKey}-I`]: { before: `*`, after: `*`, offset: 1 }, // 斜体
    [`${ctrlKey}-D`]: { before: `~~`, after: `~~`, offset: 2 }, // 删除线
    [`${ctrlKey}-E`]: { before: `\``, after: `\``, offset: 1 }, // 行内代码
    [`${ctrlKey}-K`]: { before: `[`, after: `](url)`, offset: 1 }, // 超链接
  }

  const format = formatMap[cmd]
  if (format) {
    // 自定义格式处理，支持光标定位
    const selection = editorInstance.getSelection()
    const cursor = editorInstance.getCursor()

    if (selection) {
      // 有选中文本，包裹选中内容
      const wrapped = `${format.before}${selection}${format.after}`
      editorInstance.replaceSelection(wrapped)
      // 选中被包裹的文本
      const start = cursor
      const end = { line: cursor.line, ch: cursor.ch + wrapped.length - format.after.length }
      editorInstance.setSelection(start, end)
    }
    else {
      // 无选中文本，插入格式符号并将光标放在中间
      const text = `${format.before}${format.after}`
      editorInstance.replaceSelection(text)
      // 将光标移动到中间位置
      editorInstance.setCursor({
        line: cursor.line,
        ch: cursor.ch + format.offset,
      })
    }
    editorInstance.focus()
  }
  else {
    // 使用原有的命令处理其他格式（如列表）
    const command = (editorInstance as any).options.extraKeys[cmd]
    if (typeof command === `function`) {
      command(editorInstance)
      // 保持编辑器焦点
      editorInstance.focus()
    }
    else {
      console.warn(`Command ${cmd} not found in extraKeys`)
    }
  }
}

// 应用标题格式
function applyHeadingLevel(level: number) {
  if (!editor.value)
    return

  const editorInstance = editor.value
  editorInstance.operation(() => {
    const ranges = editorInstance.listSelections()

    ranges.filter((range: any) => range && typeof range.from === `function` && typeof range.to === `function`).forEach((range: any) => {
      const from = range.from()
      const to = range.to()

      if (!from || !to || typeof from.line === `undefined` || typeof to.line === `undefined`)
        return

      for (let line = from.line; line <= to.line; line++) {
        const text = editorInstance.getLine(line)
        if (typeof text !== `string`)
          continue
        // 去掉已有的 # 前缀（1~6 个）+ 空格
        const cleaned = text.replace(/^#{1,6}\s+/, ``).trimStart()
        const heading = `${`#`.repeat(level)} ${cleaned}`
        editorInstance.replaceRange(
          heading,
          { line, ch: 0 },
          { line, ch: text.length },
        )
      }
    })
  })
  // 保持编辑器焦点
  editorInstance.focus()
}

// 应用引用格式
function applyQuote() {
  if (!editor.value)
    return

  const editorInstance = editor.value
  editorInstance.operation(() => {
    const ranges = editorInstance.listSelections()

    ranges.filter((range: any) => range && typeof range.from === `function` && typeof range.to === `function`).forEach((range: any) => {
      const from = range.from()
      const to = range.to()

      if (!from || !to || typeof from.line === `undefined` || typeof to.line === `undefined`)
        return

      for (let line = from.line; line <= to.line; line++) {
        const text = editorInstance.getLine(line)
        if (typeof text !== `string`)
          continue
        // 如果已经是引用，则去掉引用；否则添加引用
        if (text.startsWith(`> `)) {
          const unquoted = text.replace(/^>\s+/, ``)
          editorInstance.replaceRange(
            unquoted,
            { line, ch: 0 },
            { line, ch: text.length },
          )
        }
        else {
          const quoted = `> ${text}`
          editorInstance.replaceRange(
            quoted,
            { line, ch: 0 },
            { line, ch: text.length },
          )
        }
      }
    })
  })
  // 保持编辑器焦点
  editorInstance.focus()
}

// 插入分割线
function insertHorizontalRule() {
  if (!editor.value)
    return

  const editorInstance = toRaw(editor.value)
  const cursor = editorInstance.getCursor()
  // 插入分割线，前后添加空行
  const hrText = `\n---\n`
  editorInstance.replaceSelection(hrText)
  // 将光标移动到分割线后
  editorInstance.setCursor({
    line: cursor.line + 2,
    ch: 0,
  })

  // 移动端需要刷新编辑器以确保光标正确定位
  if (isMobile.value) {
    nextTick(() => {
      editorInstance.refresh()
      setTimeout(() => {
        editorInstance.focus()
      }, 100)
    })
  }
  else {
    editorInstance.focus()
  }
}

// 插入 Mermaid 图表
function insertMermaidChart() {
  if (!editor.value)
    return

  const editorInstance = editor.value
  // 插入 Mermaid 饼图示例
  const mermaidText = `\n\`\`\`mermaid
pie
    title 浏览器市场份额
    "Chrome" : 65
    "Safari" : 15
    "Firefox" : 10
    "其他" : 10
\`\`\`\n`
  editorInstance.replaceSelection(mermaidText)
  editorInstance.focus()
}

// 段落首行缩进 - 切换全局缩进样式
function applyParagraphIndent() {
  store.useIndentChanged()
  // 显示当前缩进状态
  nextTick(() => {
    const status = store.isUseIndent ? `已开启` : `已关闭`
    toast.success(`段落首行缩进${status}`)
  })
}

// 撤销
function handleUndo() {
  if (!editor.value)
    return
  editor.value.undo()
  editor.value.focus()
}

// 重做
function handleRedo() {
  if (!editor.value)
    return
  editor.value.redo()
  editor.value.focus()
}

// 清空内容
function handleClearContent() {
  if (!editor.value)
    return
  // eslint-disable-next-line no-alert
  if (window.confirm(`确定要清空编辑器内容吗？`)) {
    const editorInstance = toRaw(editor.value)
    editorInstance.setValue(``)
    // 设置光标到起始位置
    editorInstance.setCursor({ line: 0, ch: 0 })

    // 移动端：切换到编辑模式并聚焦（由父组件处理）
    if (isMobile.value) {
      emit(`switchToEditor`)
    }
    else {
      toast.success(`已清空内容`)
      setTimeout(() => editorInstance.focus(), 300)
    }
  }
}

// 删除光标所在行
function handleDeleteCurrentLine() {
  if (!editor.value)
    return
  const editorInstance = editor.value
  const cursor = editorInstance.getCursor()
  const line = cursor.line
  const lineCount = editorInstance.lineCount()

  // 获取所有内容
  const allLines = editorInstance.getValue().split(`\n`)

  // 如果只有一行，清空内容
  if (lineCount === 1) {
    editorInstance.setValue(``)
    editorInstance.setCursor({ line: 0, ch: 0 })
  }
  else {
    // 删除指定行
    allLines.splice(line, 1)
    const newContent = allLines.join(`\n`)

    // 设置新内容
    editorInstance.setValue(newContent)

    // 设置光标位置
    const newLine = Math.min(line, editorInstance.lineCount() - 1)
    editorInstance.setCursor({ line: newLine, ch: 0 })
  }

  editorInstance.focus()
}

const copyMode = useStorage(addPrefix(`copyMode`), `txt`)

// 一键美化状态
const isBeautifying = ref(false)
const beautifyDialogVisible = ref(false)
const beautifyConfirmVisible = ref(false)

// 显示一键美化确认对话框
function showBeautifyConfirm() {
  if (!editor.value || isBeautifying.value)
    return

  const content = editor.value.getValue()
  if (!content.trim()) {
    toast.error(`编辑器内容为空`)
    return
  }

  beautifyConfirmVisible.value = true
}

// 不同排版模式的 prompt
const beautifyPrompts = {
  simple: `你是一个 Markdown 格式优化专家。请将原文优化为良好的 Markdown 格式。

【重要规则】
- 严禁修改、增加、删除、改写原文的任何文字内容
- 只能添加修改 Markdown 格式标记（#、**、空行等）
- 段落间要有空行，内容分段落空一行
- 标题统一使用 H4（#### ），不使用其他级别的标题
- 不要使用无序列表和有序列表

【格式要求】
1. 直接输出 Markdown 源码，不要包含 \`\`\`markdown 或任何代码块标记
2. 确保输出符合标准 Markdown 语法`,

  standard: `你是一个 Markdown 格式优化专家。请将原文优化为良好的 Markdown 格式。

【重要规则】
- 严禁修改、增加、删除、改写原文的任何文字内容
- 严禁调整原文的语序、用词、语气
- 只能添加 Markdown 格式标记（#、**、*、>、空行等）
- 原文是什么就输出什么，一字不改

【格式要求】
1. 直接输出 Markdown 源码，不要包含 \`\`\`markdown 或任何代码块标记
2. 根据内容智能分段并合理设置各级标题（使用h3 h4 h5 不使用h1 h2）
3. 适当使用引用、粗体、斜体等格式标记
4. 不要使用无序列表和有序列表
5. 内容分段落空一行
6. 只优化 Markdown 格式，不修改任何文字内容
7. 确保输出符合标准 Markdown 语法`,

  professional: `你是一个 Markdown 格式优化专家。请将原文优化为专业级的 Markdown 格式。

【重要规则】
- 严禁修改、增加、删除、改写原文的任何文字内容
- 严禁调整原文的语序、用词、语气
- 只能添加 Markdown 格式标记（#、**、*、>、-、---、空行等）
- 原文是什么就输出什么，一字不改

【格式要求】
1. 直接输出 Markdown 源码，不要包含 \`\`\`markdown 或任何代码块标记
2. 深度分析内容结构，设置清晰的标题层级（使用h3 h4 h5 不使用h1 h2）
3. 充分使用 Markdown 格式：引用、粗体、斜体、代码块等标记
4. 合理使用列表（有序列表、无序列表）组织要点
5. 优化段落结构，确保逻辑清晰，内容分段落空一行
6. 添加适当的分隔线增强可读性
7. 只做深度 Markdown 格式优化，不修改任何文字内容
8. 确保输出符合标准 Markdown 语法，适合正式发布`,
}

// 一键美化功能
async function beautifyMarkdown(mode: string = `simple`, customRequirement: string = ``) {
  beautifyConfirmVisible.value = false

  if (!editor.value || isBeautifying.value)
    return

  const content = editor.value.getValue()
  if (!content.trim()) {
    toast.error(`编辑器内容为空`)
    return
  }

  isBeautifying.value = true
  beautifyDialogVisible.value = true

  try {
    const { apiKey, model, endpoint, temperature, type } = aiConfigStore

    // 检查基本配置
    if (!endpoint) {
      toast.error(`请先配置 AI 接口地址`)
      beautifyDialogVisible.value = false
      return
    }

    if (!model) {
      toast.error(`请先选择 AI 模型`)
      beautifyDialogVisible.value = false
      return
    }

    // 只有非默认服务才需要验证API密钥
    if (type !== `default` && (!apiKey || apiKey === `your-api-key-here`)) {
      toast.error(`请先配置 AI 接口密钥`)
      beautifyDialogVisible.value = false
      return
    }

    // 根据模式选择对应的 prompt
    let systemPrompt = beautifyPrompts[mode as keyof typeof beautifyPrompts] || beautifyPrompts.simple

    // 如果有自定义要求，添加到 prompt 中
    if (customRequirement && customRequirement.trim()) {
      systemPrompt += `\n\n【用户自定义要求】\n${customRequirement.trim()}`
    }

    const userPrompt = `将原文的格式调整为良好的 Markdown，一定不要改变原文内容，增加减少原文文字都不可以：\n\n原文是：\n

${content}`

    // 构建正确的API URL，匹配现有AI功能的模式
    const url = new URL(endpoint)
    if (!url.pathname.endsWith(`/chat/completions`)) {
      url.pathname = url.pathname.replace(/\/?$/, `/chat/completions`)
    }

    const headers: Record<string, string> = {
      'Content-Type': `application/json`,
    }

    // 只有非默认服务才需要API密钥
    if (apiKey && aiConfigStore.type !== `default`) {
      headers.Authorization = `Bearer ${apiKey}`
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
        temperature: temperature || 0.3,
        max_tokens: aiConfigStore.maxToken || 4000,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`AI接口错误详情:`, errorText)
      throw new Error(`AI 接口请求失败 (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()
    const beautifiedContent = data.choices?.[0]?.message?.content

    if (!beautifiedContent) {
      console.error(`AI响应数据:`, data)
      throw new Error(`AI 返回内容为空，请检查API配置`)
    }

    // 替换编辑器内容
    toRaw(editor.value).setValue(beautifiedContent)
    toast.success(`一键美化完成！内容已自动格式化`)
  }
  catch (error) {
    console.error(`一键美化失败:`, error)

    // 提供更友好的错误提示
    let errorMessage = `一键美化失败`
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
      errorMessage = `一键美化失败: ${errorMsg}`
    }

    toast.error(errorMessage)
  }
  finally {
    isBeautifying.value = false
    beautifyDialogVisible.value = false
  }
}

// 抓取工具状态
const fetchDialogVisible = ref(false)

// 一键改写状态 - 引用组件
const rewriteDialogRef = ref<InstanceType<typeof RewriteDialog> | null>(null)
const rewriteDialogVisible = ref(false)

// 行业热点文案推送状态
const industryInfoDialogVisible = ref(false)

// 显示行业热点文案推送对话框
function showIndustryInfoDialog() {
  industryInfoDialogVisible.value = true
}

// 个人写作计划建议状态
const writingPlanDialogVisible = ref(false)

// 显示个人写作计划建议对话框
function showWritingPlanDialog() {
  writingPlanDialogVisible.value = true
}

// 个人知识库状态
const knowledgeBaseDialogVisible = ref(false)

// 显示个人知识库对话框
function showKnowledgeBaseDialog() {
  knowledgeBaseDialogVisible.value = true
}

// 海报制作状态
const posterGeneratorDialogVisible = ref(false)

// 显示海报制作对话框
function showPosterGeneratorDialog() {
  posterGeneratorDialogVisible.value = true
}

// Nano Banana 状态
const nanoBananaDialogVisible = ref(false)

// 显示 Nano Banana 对话框
function showNanoBananaDialog() {
  nanoBananaDialogVisible.value = true
}

// 发布到公众号状态
const publishDialogVisible = ref(false)
const showMpConfigDialog = ref(false)
const isPublishing = ref(false)
const coverImageInput = ref<HTMLInputElement | null>(null)

// 表单数据
const publishForm = ref({
  title: ``,
  imageUrl: ``,
  author: `佚名`,
  digest: ``,
  pic_crop_235_1: ``,
  pic_crop_1_1: ``,
})

// 公众号配置表单
const mpConfigForm = ref({
  appID: ``,
  appsecret: ``,
})

// 更新裁剪参数
function updateCropParameters(crop235: string, crop1: string) {
  if (crop235) {
    publishForm.value.pic_crop_235_1 = crop235
  }
  if (crop1) {
    publishForm.value.pic_crop_1_1 = crop1
  }
}

// 点击选择封面图片
function selectCoverImage() {
  coverImageInput.value?.click()
}

// 处理图片上传
async function handleCoverImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  // 验证文件类型
  if (!file.type.startsWith(`image/`)) {
    toast.error(`请选择图片文件`)
    return
  }

  // 验证文件大小（限制10MB）
  if (file.size > 10 * 1024 * 1024) {
    toast.error(`图片大小不能超过10MB`)
    return
  }

  try {
    // 转换为 Base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      publishForm.value.imageUrl = base64
      toast.success(`封面图片已选择`)
    }
    reader.onerror = () => {
      toast.error(`读取图片失败`)
    }
    reader.readAsDataURL(file)
  }
  catch (error) {
    console.error(`上传封面图片失败:`, error)
    toast.error(`上传封面图片失败`)
  }
  finally {
    // 清空input，允许重复选择同一文件
    input.value = ``
  }
}

// 保存公众号配置后的回调
function handleMpConfigSaved() {
  // 保存后自动打开发布对话框
  showPublishDialog()
}

// 显示发布对话框
function showPublishDialog() {
  const content = editor.value?.getValue()
  if (!content || !content.trim()) {
    toast.error(`编辑器内容为空，无法发布`)
    return
  }

  // 检查公众号配置是否已设置
  const mpConfig = localStorage.getItem(`mpConfig`)
  if (!mpConfig) {
    // 未设置配置，显示设置页面，清空表单
    mpConfigForm.value = { appID: ``, appsecret: `` }
    showMpConfigDialog.value = true
    return
  }

  try {
    const config = JSON.parse(mpConfig)
    if (!config.appID || !config.appsecret) {
      // 配置不完整，显示设置页面，加载已有配置
      mpConfigForm.value = config
      showMpConfigDialog.value = true
      return
    }
  }
  catch {
    // 配置解析失败，显示设置页面
    mpConfigForm.value = { appID: ``, appsecret: `` }
    showMpConfigDialog.value = true
    return
  }

  // 获取文章标题（从第一个标题或使用默认标题）
  const titleMatch = content.match(/^# (.*)$/m)
  publishForm.value.title = titleMatch ? titleMatch[1].trim() : `未命名文章`

  // 生成摘要（取正文除了标题外前50个汉字加标点符号）
  // 先移除所有标题行
  const contentWithoutTitles = content.replace(/^#{1,6}[ \t].+$/gm, ``).trim()
  // 移除Markdown语法标记，但保留汉字和标点符号
  const plainText = contentWithoutTitles
    .replace(/!\[.*?\]\(.*?\)/g, ``) // 移除图片
    .replace(/\[([^\]]+)\]\([^)]+\)/g, `$1`) // 移除链接但保留文字
    .replace(/`{1,3}[^`]*`{1,3}/g, ``) // 移除代码
    .replace(/[*_~]/g, ``) // 移除格式符号
    .replace(/^[>\-+*]\s+/gm, ``) // 移除列表和引用标记
    .replace(/\n+/g, ``) // 移除换行
    .trim()

  // 提取前50个汉字加标点符号
  const chineseAndPunctuation = plainText.match(/[\u4E00-\u9FA5\u3000-\u303F\uFF00-\uFFEF]/g) || []
  publishForm.value.digest = chineseAndPunctuation.slice(0, 50).join(``)

  // 提取文章中的第一张图片作为封面
  const imageMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/)
  if (imageMatch) {
    // 去掉URL中的 {width=100%} 等参数
    publishForm.value.imageUrl = imageMatch[1].replace(/\{[^}]*\}/g, ``).trim()
  }
  else {
    publishForm.value.imageUrl = ``
  }

  publishDialogVisible.value = true
}

// 发布到公众号
async function publishToWechat() {
  if (isPublishing.value)
    return

  const mdContent = editor.value?.getValue()
  if (!mdContent || !mdContent.trim()) {
    toast.error(`编辑器内容为空，无法发布`)
    return
  }

  // 验证必填字段
  if (!publishForm.value.title.trim()) {
    toast.error(`请填写文章标题`)
    return
  }

  if (!publishForm.value.imageUrl.trim()) {
    toast.error(`封面图片不能为空`)
    return
  }

  isPublishing.value = true

  try {
    // 获取公众号配置
    const mpConfigStr = localStorage.getItem(`mpConfig`)
    if (!mpConfigStr) {
      toast.error(`请先配置公众号信息`)
      return
    }

    const mpConfig = JSON.parse(mpConfigStr)
    if (!mpConfig.appID || !mpConfig.appsecret) {
      toast.error(`公众号配置不完整，请重新配置`)
      return
    }

    // API配置
    const API_URL = `https://wechat.easy-write.com`
    const API_KEY = `0dbe66d87befa7a9d5d7c1bdbc631a9b7dc5ce88be9a20e41c26790060802647`

    // 获取处理后的HTML内容（与"复制公众号格式"相同的处理）
    // 先处理剪贴板内容
    processClipboardContent(primaryColor.value)
    const clipboardDiv = document.getElementById(`output`)!
    const htmlContent = clipboardDiv.innerHTML

    // 准备数据
    const data = {
      title: publishForm.value.title,
      content: htmlContent,
      imageUrl: publishForm.value.imageUrl,
      author: publishForm.value.author,
      digest: publishForm.value.digest,
      titleMode: `smart`,
      pic_crop_235_1: publishForm.value.pic_crop_235_1,
      pic_crop_1_1: publishForm.value.pic_crop_1_1,
      appID: mpConfig.appID,
      appsecret: mpConfig.appsecret,
    }

    // 发送请求
    const response = await fetch(`${API_URL}/api/draft/create-with-credentials`, {
      method: `POST`,
      headers: {
        'Content-Type': `application/json`,
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      // 尝试解析错误响应中的message
      const errorText = await response.text()
      console.error(`API错误响应 (${response.status}):`, errorText)

      try {
        const errorResult = JSON.parse(errorText)
        throw new Error(errorResult.message || errorResult.error || `请求失败 (${response.status}): ${response.statusText}`)
      }
      catch {
        // JSON解析失败，直接使用文本内容
        throw new Error(errorText || `请求失败 (${response.status}): ${response.statusText}`)
      }
    }

    const result = await response.json()

    if (result.success) {
      toast.success(`✅ 恭喜您！公众号草稿创建成功！请转到公众号助手或者登录公众号平台https://mp.weixin.qq.com/查看`, {
        description: `文章标题：${publishForm.value.title}\n\n`,
        duration: 10000,
      })
      publishDialogVisible.value = false
    }
    else {
      // 打印失败响应
      console.error(`API失败响应:`, result)
      throw new Error(result.message || `公众号创建草稿失败`)
    }
  }
  catch (error) {
    console.error(`发布到公众号失败:`, error)

    const errorMsg = error instanceof Error ? error.message : String(error)

    // 检查是否是IP白名单错误
    if (errorMsg.includes(`not in whitelist`) || errorMsg.includes(`invalid ip`)) {
      // 提取IP地址
      const ipMatch = errorMsg.match(/(\d+\.\d+\.\d+\.\d+)/)
      const ip = ipMatch ? ipMatch[1] : ``

      toast.error(`IP白名单错误：请将以下IP添加到公众号白名单中`, {
        description: ip ? `需要添加的IP: ${ip}\n\n操作步骤：\n1. 登录微信公众平台(https://mp.weixin.qq.com/)\n2. 设置与开发 → 开发接口管理 → 基本配置 → IP白名单 → 查看(修改)\n3. 添加上述IP地址` : `请登录微信公众平台添加服务器IP到白名单`,
        duration: 15000,
      })
    }
    else {
      // 其他错误直接显示
      toast.error(errorMsg)
    }
  }
  finally {
    isPublishing.value = false
  }
}

// 显示改写对话框
function showRewriteDialog() {
  rewriteDialogRef.value?.show()
}

// 显示抓取工具对话框
function showFetchDialog() {
  fetchDialogVisible.value = true
}

const { copy: copyContent } = useClipboard({
  legacy: true,
})

// 复制到微信公众号
async function copy() {
  // 如果是 Markdown 源码，直接复制并返回
  if (copyMode.value === `md`) {
    const mdContent = editor.value?.getValue() || ``
    await copyContent(mdContent)
    toast.success(`已复制 Markdown 源码到剪贴板。`)
    return
  }

  // 以下处理非 Markdown 的复制流程
  emit(`startCopy`)

  setTimeout(() => {
    // 如果是深色模式，复制之前需要先切换到白天模式
    const isBeforeDark = isDark.value
    if (isBeforeDark) {
      toggleDark()
    }

    nextTick(async () => {
      processClipboardContent(primaryColor.value)
      const clipboardDiv = document.getElementById(`output`)!
      clipboardDiv.focus()
      window.getSelection()!.removeAllRanges()

      const temp = clipboardDiv.innerHTML

      if (copyMode.value === `txt`) {
        const range = document.createRange()
        range.setStartBefore(clipboardDiv.firstChild!)
        range.setEndAfter(clipboardDiv.lastChild!)
        window.getSelection()!.addRange(range)
        document.execCommand(`copy`)
        window.getSelection()!.removeAllRanges()
      }

      clipboardDiv.innerHTML = output.value

      if (isBeforeDark) {
        nextTick(() => toggleDark())
      }

      if (copyMode.value === `html`) {
        await copyContent(temp)
      }

      // 输出提示
      toast.success(
        copyMode.value === `html`
          ? `已复制 HTML 源码，请进行下一步操作。`
          : `已复制渲染后的内容到剪贴板，可直接到公众号后台粘贴。`,
      )
      window.dispatchEvent(
        new CustomEvent(`copyToMp`, {
          detail: {
            content: output.value,
          },
        }),
      )
      editorRefresh()
      emit(`endCopy`)
    })
  }, 350)
}

// 处理复制操作
function handleCopyWithMode(mode: string) {
  copyMode.value = mode
  copy()
}
</script>

<template>
  <header
    class="backdrop-blur-sm header-container fixed left-0 right-0 top-0 z-50 min-h-15 flex flex-wrap items-center bg-white px-2 py-1 sm:h-15 dark:bg-[#191c20] sm:px-5"
  >
    <!-- 左侧操作区：所有工具按钮 -->
    <div class="space-x-1 sm:space-x-2 w-full flex items-center sm:min-w-0 sm:flex-1">
      <!-- 菜单栏 -->
      <Menubar class="compact-mobile compact-menubar extra-compact menubar sm:border-input sm:dark:border-input h-11 border-gray-400 sm:h-10 dark:border-gray-600">
        <StyleDropdown :copy-mode="copyMode" :on-copy="handleCopyWithMode" />
      </Menubar>

      <!-- 移动端工具栏切换 -->
      <Button
        v-if="isMobile"
        variant="outline"
        title="编辑器"
        class="h-11 border-gray-400 px-2 -ml-2 dark:border-gray-600 !text-base" :class="[
          isShowMobileToolbar ? 'bg-blue-50 dark:bg-blue-950' : '',
        ]"
        @click="isShowMobileToolbar = !isShowMobileToolbar"
      >
        <Pencil class="mr-1 size-5" />
        编辑
      </Button>

      <!-- 撤销重做 - 电脑端显示 -->
      <Button
        variant="outline"
        size="icon"
        title="撤销"
        class="hidden sm:inline-flex"
        @click="undo()"
      >
        <Undo class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="重做"
        class="hidden sm:inline-flex"
        @click="redo()"
      >
        <Redo class="size-4" />
      </Button>

      <!-- 格式化工具 - 电脑端显示 -->
      <Button
        variant="outline"
        size="icon"
        title="格式化"
        class="hidden sm:inline-flex"
        @click="formatContent()"
      >
        <Wand2 class="size-4" />
      </Button>

      <!-- 标题选择 - 电脑端显示 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="outline"
            size="icon"
            title="标题"
            class="hidden sm:inline-flex"
          >
            <Heading class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem @click="insertHeading(1)">
            <span class="text-2xl font-bold">H1</span>
            <span class="text-muted-foreground ml-2 text-sm">一级标题</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="insertHeading(2)">
            <span class="text-xl font-bold">H2</span>
            <span class="text-muted-foreground ml-2 text-sm">二级标题</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="insertHeading(3)">
            <span class="text-lg font-bold">H3</span>
            <span class="text-muted-foreground ml-2 text-sm">三级标题</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="insertHeading(4)">
            <span class="font-bold">H4</span>
            <span class="text-muted-foreground ml-2 text-sm">四级标题</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="insertHeading(5)">
            <span class="text-sm font-bold">H5</span>
            <span class="text-muted-foreground ml-2 text-sm">五级标题</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="insertHeading(6)">
            <span class="text-xs font-bold">H6</span>
            <span class="text-muted-foreground ml-2 text-sm">六级标题</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="icon"
        title="加粗"
        class="hidden sm:inline-flex"
        @click="addFormat(`${ctrlKey}-B`)"
      >
        <Bold class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="引用"
        class="hidden sm:inline-flex"
        @click="insertQuote()"
      >
        <Quote class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="超链接"
        class="hidden sm:inline-flex"
        @click="addFormat(`${ctrlKey}-K`)"
      >
        <Link class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="有序列表"
        class="hidden sm:inline-flex"
        @click="addFormat(`${ctrlKey}-O`)"
      >
        <ListOrdered class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="无序列表"
        class="hidden sm:inline-flex"
        @click="addFormat(`${ctrlKey}-U`)"
      >
        <List class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="分割线"
        class="hidden sm:inline-flex"
        @click="insertDivider()"
      >
        <Minus class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="段落首行缩进"
        class="hidden sm:inline-flex"
        @click="insertIndent()"
      >
        <Indent class="size-4" />
      </Button>

      <!-- 插入工具 - 电脑端显示 -->
      <Button
        variant="outline"
        size="icon"
        title="上传图片"
        class="hidden sm:inline-flex"
        @click="displayStore.toggleShowUploadImgDialog()"
      >
        <ImagePlus class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="插入表格"
        class="hidden sm:inline-flex"
        @click="displayStore.toggleShowInsertFormDialog()"
      >
        <Table class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="图表工具"
        class="hidden sm:inline-flex"
        @click="addFormat(`${ctrlKey}-M`)"
      >
        <ChartPie class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="插入公众号名片"
        class="hidden sm:inline-flex"
        @click="displayStore.toggleShowInsertMpCardDialog()"
      >
        <CreditCard class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="删除当前行"
        class="hidden sm:inline-flex"
        @click="deleteLine()"
      >
        <Trash2 class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="清空编辑器"
        class="hidden sm:inline-flex"
        @click="clearEditor()"
      >
        <FileX2 class="size-4" />
      </Button>

      <!-- 工具 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="sm:border-input sm:dark:border-input h-11 border-gray-400 px-2 sm:h-10 dark:border-gray-600 !text-base">
            工具🔥
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="py-2">
          <DropdownMenuItem class="py-3 text-base" @click="showRewriteDialog()">
            <Wand2 class="mr-2 size-5" />
            全文一键改写
          </DropdownMenuItem>
          <DropdownMenuItem :disabled="isBeautifying" class="py-3 text-base" @click="showBeautifyConfirm()">
            <Sparkles class="mr-2 size-5" />
            {{ isBeautifying ? '美化中...' : '全文一键排版' }}
          </DropdownMenuItem>
          <DropdownMenuItem class="py-3 text-base" @click="showFetchDialog()">
            <Wrench class="mr-2 size-5" />
            公众号文章抓取工具
          </DropdownMenuItem>
          <DropdownMenuItem class="py-3 text-base" @click="showIndustryInfoDialog()">
            <Newspaper class="mr-2 size-5" />
            行业热点文案推送
          </DropdownMenuItem>
          <DropdownMenuItem class="py-3 text-base" @click="showWritingPlanDialog()">
            <Calendar class="mr-2 size-5" />
            个人写作计划✍️
          </DropdownMenuItem>
          <DropdownMenuItem class="py-3 text-base" @click="showKnowledgeBaseDialog()">
            <BookOpen class="mr-2 size-5" />
            个人知识库
          </DropdownMenuItem>
          <DropdownMenuItem class="py-3 text-base" @click="showPosterGeneratorDialog()">
            <ImagePlus class="mr-2 size-5" />
            <span class="flex items-center gap-2">
              海报制作
              <span class="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white font-semibold">
                NEW
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem class="py-3 text-base" @click="showNanoBananaDialog()">
            <Gem class="mr-2 size-5" />
            <span class="flex items-center gap-2">
              Nano Banana图片工具
              <span class="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white font-semibold">
                NEW
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- 主题选择 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="sm:border-input sm:dark:border-input h-11 border-gray-400 px-2 sm:h-10 dark:border-gray-600 !text-base" title="主题">
            主题
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup :model-value="theme" @update:model-value="themeChanged">
            <DropdownMenuRadioItem
              v-for="option in themeOptions"
              :key="option.value"
              :value="option.value"
              class="text-base"
            >
              {{ option.label }}
              <span v-if="option.desc" class="text-muted-foreground ml-1 text-xs">
                {{ option.desc }}
              </span>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- 发布菜单 -->
      <Menubar class="menubar compact-menubar sm:border-input sm:dark:border-input h-11 border-gray-400 sm:h-10 dark:border-gray-600">
        <FileDropdown :copy-mode="copyMode" :on-copy="handleCopyWithMode" :on-show-publish-dialog="showPublishDialog" />
      </Menubar>

      <!-- 设置按钮 -->
      <Button
        variant="outline"
        size="icon"
        class="sm:border-input sm:dark:border-input h-11 w-11 border-gray-400 sm:h-10 sm:w-10 dark:border-gray-600"
        @click="store.isOpenRightSlider = !store.isOpenRightSlider"
      >
        <Settings class="size-5 sm:size-4" />
      </Button>
    </div>

    <!-- 右侧操作区：手机端第二行显示 -->
    <div class="space-x-1 mt-1 w-full flex items-center justify-start sm:mt-0 sm:w-auto sm:justify-end">
      <!-- 文章信息（移动端隐藏） -->
      <div class="hidden sm:inline-flex">
        <PostInfo />
      </div>
    </div>

    <!-- 移动端格式工具栏 -->
    <transition
      enter-active-class="toolbar-slide-enter-active"
      leave-active-class="toolbar-slide-leave-active"
    >
      <div
        v-if="isMobile && isShowMobileToolbar"
        class="w-full bg-white pr-5 dark:bg-[#191c20]"
      >
        <div class="flex flex-wrap items-center justify-start gap-1">
          <!-- 简历预设模块 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900"
            title="预设模块"
            @click="isOpenPresetPanel = !isOpenPresetPanel"
          >
            预设模块
          </Button>
          <!-- 标题1 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            @click="applyHeadingLevel(1)"
          >
            H1
          </Button>
          <!-- 标题2 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            @click="applyHeadingLevel(2)"
          >
            H2
          </Button>
          <!-- 标题3 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            @click="applyHeadingLevel(3)"
          >
            H3
          </Button>
          <!-- 标题4 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            @click="applyHeadingLevel(4)"
          >
            H4
          </Button>
          <!-- 标题5 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            @click="applyHeadingLevel(5)"
          >
            H5
          </Button>
          <!-- 标题6 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            @click="applyHeadingLevel(6)"
          >
            H6
          </Button>
          <!-- 加粗 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="加粗"
            @click="addFormat(`${ctrlKey}-B`)"
          >
            <Bold class="size-4" />
          </Button>
          <!-- 删除线 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="删除线"
            @click="addFormat(`${ctrlKey}-D`)"
          >
            <Strikethrough class="size-4" />
          </Button>
          <!-- 无序列表 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="无序列表"
            @click="addFormat(`${ctrlKey}-U`)"
          >
            <List class="size-4" />
          </Button>
          <!-- 有序列表 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="有序列表"
            @click="addFormat(`${ctrlKey}-O`)"
          >
            <ListOrdered class="size-4" />
          </Button>
          <!-- 引用 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="引用"
            @click="applyQuote()"
          >
            <Quote class="size-4" />
          </Button>
          <!-- 分割线 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="分割线"
            @click="insertHorizontalRule()"
          >
            <MinusSquare class="size-4" />
          </Button>
          <!-- 图表工具 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="图表工具"
            @click="insertMermaidChart()"
          >
            <ChartPie class="size-4" />
          </Button>
          <!-- 行内代码 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="行内代码"
            @click="addFormat(`${ctrlKey}-E`)"
          >
            <Code class="size-4" />
          </Button>
          <!-- 超链接 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="超链接"
            @click="addFormat(`${ctrlKey}-K`)"
          >
            <Link class="size-4" />
          </Button>
          <!-- 段落首行缩进 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            :class="{ 'bg-blue-50 dark:bg-blue-950': store.isUseIndent }"
            title="段落首行缩进"
            @click="applyParagraphIndent()"
          >
            <Indent class="size-4" />
          </Button>
          <!-- 撤销 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="撤销"
            @click="handleUndo"
          >
            <Undo class="size-4" />
          </Button>
          <!-- 重做 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="重做"
            @click="handleRedo"
          >
            <Redo class="size-4" />
          </Button>
          <!-- 上传图片 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="上传图片"
            @click="displayStore.toggleShowUploadImgDialog()"
          >
            <ImagePlus class="size-4" />
          </Button>
          <!-- 表格 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="插入表格"
            @click="displayStore.toggleShowInsertFormDialog()"
          >
            <Table class="size-4" />
          </Button>
          <!-- 删除当前行 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="删除当前行"
            @click="handleDeleteCurrentLine"
          >
            <Trash2 class="mr-1 size-4" />
            删除行
          </Button>
          <!-- 格式化 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="格式化"
            @click="formatContent()"
          >
            <Wand2 class="mr-1 size-4" />
            格式化
          </Button>
          <!-- 清空内容 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="清空内容"
            @click="handleClearContent"
          >
            <FileX2 class="mr-1 size-4" />
            清空
          </Button>
        </div>
      </div>
    </transition>
  </header>

  <!-- 全文一键排版对话框 -->
  <BeautifyDialog
    v-model:confirm-visible="beautifyConfirmVisible"
    v-model:loading-visible="beautifyDialogVisible"
    @confirm="beautifyMarkdown"
  />

  <!-- 抓取工具对话框 -->
  <FetchArticleDialog v-model:visible="fetchDialogVisible" />

  <!-- 一键改写对话框 -->
  <RewriteDialog ref="rewriteDialogRef" v-model:visible="rewriteDialogVisible" />

  <!-- 行业热点文案推送对话框 -->
  <IndustryHotspotDialog v-model:visible="industryInfoDialogVisible" />

  <!-- 个人写作计划建议对话框 -->
  <WritingPlanDialog v-model:visible="writingPlanDialogVisible" />

  <!-- 个人知识库对话框 -->
  <div
    v-if="knowledgeBaseDialogVisible"
    class="backdrop-blur-sm fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
    @click="knowledgeBaseDialogVisible = false"
  >
    <div
      class="mx-4 max-w-lg w-[90vw] scale-100 transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 标题图标 -->
      <div class="mb-4 flex items-center justify-center">
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-12 w-12 flex items-center justify-center rounded-full">
          <BookOpen class="h-6 w-6 text-white" />
        </div>
      </div>

      <!-- 标题 -->
      <h3 class="mb-2 text-center text-xl text-gray-900 font-bold dark:text-gray-100">
        个人知识库
      </h3>

      <!-- 描述 -->
      <p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        建设中...
      </p>

      <!-- 内容区域 -->
      <div class="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <span class="font-medium">📚 功能说明：</span>
        </p>
        <p class="mt-2 text-sm text-blue-700 dark:text-blue-300">
          个人AI知识库是您写文章时的背景文件，您写作的文章会围绕您的知识库来编写。
        </p>
      </div>

      <!-- 按钮组 -->
      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          class="flex-1"
          @click="knowledgeBaseDialogVisible = false"
        >
          关闭
        </Button>
        <Button
          class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 flex-1 border-0 text-white"
          disabled
          @click="knowledgeBaseDialogVisible = false"
        >
          <BookOpen class="mr-1 h-4 w-4" />
          敬请期待
        </Button>
      </div>
    </div>
  </div>

  <!-- 隐藏的文件选择输入框 -->
  <input
    ref="coverImageInput"
    type="file"
    accept="image/*"
    class="hidden"
    @change="handleCoverImageChange"
  >

  <!-- 公众号配置对话框 -->
  <MpConfigDialog
    v-model:visible="showMpConfigDialog"
    :initial-config="mpConfigForm"
    @saved="handleMpConfigSaved"
  />

  <!-- 发布到公众号对话框 -->
  <PublishDialog
    v-model:visible="publishDialogVisible"
    :is-publishing="isPublishing"
    :publish-form="publishForm"
    @publish="publishToWechat"
    @select-image="selectCoverImage"
    @update-crop="updateCropParameters"
  />

  <!-- 海报制作对话框 -->
  <PosterGeneratorDialog v-model:open="posterGeneratorDialogVisible" />

  <!-- Nano Banana 对话框 -->
  <NanoBananaDialog v-model:visible="nanoBananaDialogVisible" />
</template>

<style lang="less" scoped>
.menubar {
  user-select: none;
}

.compact-menubar :deep(.menubar__trigger) {
  padding-left: 0.5rem !important;
  padding-right: 0.5rem !important;
}

.extra-compact :deep(.menubar__trigger) {
  padding-left: 0.375rem !important;
  padding-right: 0.375rem !important;
}

.compact-mobile :deep(.menubar__trigger) {
  @media (max-width: 640px) {
    padding-left: 0.375rem !important;
    padding-right: 0.375rem !important;
    font-size: 0.875rem;
  }
}

kbd {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #a8a8a8;
  padding: 1px 4px;
  border-radius: 2px;
}

/* 工具栏滑动动画 */
.toolbar-slide-enter-active,
.toolbar-slide-leave-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.toolbar-slide-enter-active {
  animation: slideDown 0.3s ease-out;
}

.toolbar-slide-leave-active {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideDown {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 200px;
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    max-height: 200px;
    opacity: 1;
  }
  to {
    max-height: 0;
    opacity: 0;
  }
}
</style>
