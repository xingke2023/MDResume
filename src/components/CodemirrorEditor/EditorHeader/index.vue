<script setup lang="ts">
import {
  Bold,
  ChartPie,
  Code,
  CreditCard,
  Eraser,
  ImagePlus,
  Indent,
  Italic,
  LayoutList,
  Link,
  List,
  ListOrdered,
  MinusSquare,
  Newspaper,
  Palette,
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
import { toast } from 'vue-sonner'
import { ctrlKey, themeOptions } from '@/config'
import { useDisplayStore, useStore } from '@/stores'
import useAIConfigStore from '@/stores/AIConfig'
import { addPrefix, processClipboardContent } from '@/utils'

const emit = defineEmits([`startCopy`, `endCopy`])

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

    ranges.filter(range => range && typeof range.from === `function` && typeof range.to === `function`).forEach((range) => {
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

    ranges.filter(range => range && typeof range.from === `function` && typeof range.to === `function`).forEach((range) => {
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

  const editorInstance = editor.value
  const cursor = editorInstance.getCursor()
  // 插入分割线，前后添加空行
  const hrText = `\n---\n`
  editorInstance.replaceSelection(hrText)
  // 将光标移动到分割线后
  editorInstance.setCursor({
    line: cursor.line + 2,
    ch: 0,
  })
  editorInstance.focus()
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
    editor.value.setValue(``)
    editor.value.focus()
    toast.success(`已清空内容`)
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

// 一键美化功能
async function beautifyMarkdown() {
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

    const systemPrompt = `请将原文的格式调整为良好的 Markdown，一定不要改变原文内容，增加减少原文文字都不可以。

要求：
1. 直接输出 Markdown 源码，不要包含 \`\`\`markdown 或任何代码块标记
2. 根据内容智能分段并合理设置各级标题（使用h3 h4 h5 不使用h1 h2）
3. 适当使用引用、粗体、斜体等格式，
4. 不要使用无序列表，有序列表
5. 内容分段落空一行
4. 保持原文内容不变，只优化格式，确保输出符合标准 Markdown
5. 确保输出符合标准 Markdown 语法`

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
const isFetching = ref(false)
const fetchDialogVisible = ref(false)
const fetchUrl = ref(``)
const fetchUrlInput = ref<HTMLInputElement | null>(null)

// 一键改写状态
const isRewriting = ref(false)
const rewriteDialogVisible = ref(false)
const rewriteRequirement = ref(``)

// 行业信息推送状态
const industryInfoDialogVisible = ref(false)

// 显示行业信息推送对话框
function showIndustryInfoDialog() {
  industryInfoDialogVisible.value = true
}

// 显示改写对话框
function showRewriteDialog() {
  if (!editor.value)
    return

  const content = editor.value.getValue()
  if (!content.trim()) {
    toast.error(`编辑器内容为空，无法改写`)
    return
  }

  rewriteRequirement.value = ``
  rewriteDialogVisible.value = true
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
    // TODO: 替换为实际的API接口地址
    const apiEndpoint = `https://api.example.com/rewrite` // 稍后替换为真实接口

    const response = await fetch(apiEndpoint, {
      method: `POST`,
      headers: {
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({
        content,
        requirement,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`改写接口错误详情:`, errorText)
      throw new Error(`改写失败 (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()
    const rewrittenContent = data.content || data.text || data.markdown || data.result

    if (!rewrittenContent) {
      console.error(`API响应数据:`, data)
      throw new Error(`API 返回内容为空`)
    }

    // 追加到编辑器末尾，添加分隔符
    const currentContent = editor.value.getValue()
    const separator = `\n\n---\n\n## 改写版本\n\n`
    const newContent = currentContent + separator + rewrittenContent

    editor.value.setValue(newContent)

    // 滚动到改写内容位置
    const lineCount = editor.value.lineCount()
    editor.value.scrollIntoView({ line: lineCount - 1, ch: 0 })

    toast.success(`改写完成！内容已追加到原文后面`)
    rewriteDialogVisible.value = false
  }
  catch (error) {
    console.error(`改写失败:`, error)

    // 提供更友好的错误提示
    let errorMessage = `改写失败`
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes(`Failed to fetch`) || errorMsg.includes(`CORS`) || errorMsg.includes(`cross-origin`)) {
      errorMessage = `CORS跨域错误：请确保改写接口支持跨域访问`
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
      errorMessage = `改写失败: ${errorMsg}`
    }

    toast.error(errorMessage)
  }
  finally {
    isRewriting.value = false
  }
}

// 监听抓取对话框显示状态，自动聚焦输入框
watch(fetchDialogVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      setTimeout(() => {
        const input = fetchUrlInput.value
        if (input) {
          input.focus()
          // 在移动端，尝试触发点击以确保键盘弹出
          input.click()
        }
      }, 200)
    })
  }
})

// 显示抓取工具对话框
function showFetchDialog() {
  fetchUrl.value = ``
  fetchDialogVisible.value = true
}

// 抓取公众号文章
async function fetchArticle() {
  if (!editor.value || isFetching.value)
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
      : `https://wechat.easy-write.com/api/extract`

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
    toRaw(editor.value).setValue(content)
    toast.success(`文章抓取成功！内容已导入编辑器`)
    fetchDialogVisible.value = false
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
      <Menubar class="compact-mobile compact-menubar extra-compact menubar">
        <StyleDropdown :copy-mode="copyMode" :on-copy="handleCopyWithMode" />
      </Menubar>

      <!-- 移动端工具栏切换 -->
      <Button
        v-if="isMobile"
        variant="outline"
        size="icon"
        title="工具"
        class="text-red-500 -ml-2 dark:text-red-400" :class="[
          isShowMobileToolbar ? 'bg-blue-50 dark:bg-blue-950' : '',
        ]"
        @click="isShowMobileToolbar = !isShowMobileToolbar"
      >
        <Pencil class="size-4" />
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
        title="插入公众号名片"
        class="hidden sm:inline-flex"
        @click="displayStore.toggleShowInsertMpCardDialog()"
      >
        <CreditCard class="size-4" />
      </Button>

      <!-- 工具 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="px-2">
            工具库
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="py-2">
          <DropdownMenuItem :disabled="isBeautifying" class="py-2.5" @click="showBeautifyConfirm()">
            <Sparkles class="mr-2 size-4" />
            {{ isBeautifying ? '美化中...' : '一键格式美化' }}
          </DropdownMenuItem>
          <DropdownMenuItem :disabled="isFetching" class="py-2.5" @click="showFetchDialog()">
            <Wrench class="mr-2 size-4" />
            {{ isFetching ? '抓取中...' : '公众号文章抓取工具' }}
          </DropdownMenuItem>
          <DropdownMenuItem :disabled="isRewriting" class="py-2.5" @click="showRewriteDialog()">
            <Wand2 class="mr-2 size-4" />
            {{ isRewriting ? '改写中...' : '文案改写工具' }}
          </DropdownMenuItem>
          <DropdownMenuItem class="py-2.5" @click="showIndustryInfoDialog()">
            <Newspaper class="mr-2 size-4" />
            一手行业信息推送
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- 复制菜单 -->
      <Menubar class="menubar compact-menubar">
        <FileDropdown :copy-mode="copyMode" :on-copy="handleCopyWithMode" />
      </Menubar>

      <!-- 主题选择 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="icon" title="主题">
            <Palette class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup :model-value="theme" @update:model-value="themeChanged">
            <DropdownMenuRadioItem
              v-for="option in themeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
              <span v-if="option.desc" class="text-muted-foreground ml-1 text-xs">
                {{ option.desc }}
              </span>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- 设置按钮 -->
      <Button
        variant="outline"
        size="icon"
        @click="store.isOpenRightSlider = !store.isOpenRightSlider"
      >
        <Settings class="size-4" />
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
        class="w-full bg-white p-3 dark:bg-[#191c20]"
      >
        <div class="flex flex-wrap items-center justify-start gap-1.5">
          <!-- 简历预设模块 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900"
            title="简历预设模块"
            @click="isOpenPresetPanel = !isOpenPresetPanel"
          >
            <LayoutList class="mr-1 size-4" />
            简历预设模块
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
          <!-- 斜体 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="斜体"
            @click="addFormat(`${ctrlKey}-I`)"
          >
            <Italic class="size-4" />
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
          <!-- 格式化 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="格式化"
            @click="formatContent()"
          >
            <Wand2 class="size-4" />
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
          <!-- 插入公众号名片 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="插入公众号名片"
            @click="displayStore.toggleShowInsertMpCardDialog()"
          >
            <CreditCard class="size-4" />
          </Button>
          <!-- 删除当前行 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="删除当前行"
            @click="handleDeleteCurrentLine"
          >
            <Eraser class="size-4" />
          </Button>
          <!-- 清空内容 -->
          <Button
            variant="outline"
            size="sm"
            class="flex-shrink-0"
            title="清空内容"
            @click="handleClearContent"
          >
            <Trash2 class="size-4" />
          </Button>
        </div>
      </div>
    </transition>
  </header>

  <!-- 一键美化确认对话框 -->
  <div
    v-if="beautifyConfirmVisible"
    class="backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click="beautifyConfirmVisible = false"
  >
    <div
      class="mx-4 max-w-lg w-[90vw] scale-100 transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 标题图标 -->
      <div class="mb-4 flex items-center justify-center">
        <div class="from-blue-500 to-purple-600 bg-gradient-to-r h-12 w-12 flex items-center justify-center rounded-full">
          <Sparkles class="h-6 w-6 text-white" />
        </div>
      </div>

      <!-- 标题 -->
      <h3 class="mb-2 text-center text-xl text-gray-900 font-bold dark:text-gray-100">
        一键美化确认
      </h3>

      <!-- 提示内容 -->
      <div class="space-y-2 mb-6 text-sm text-gray-600 leading-relaxed dark:text-gray-300">
        <p class="text-center text-orange-600 font-medium dark:text-orange-400">
          ⚠️ 重要提醒：此操作将会完全替换当前编辑器内容
        </p>
        <div class="space-y-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
          <p>• <strong>格式美化：</strong>自动调整标题层级、段落结构</p>
          <p>• <strong>内容保持：</strong>保留原文核心含义，仅优化格式</p>
          <p>• <strong>一键撤销：</strong>如不满意结果，可使用 Ctrl+Z 快速恢复</p>
        </div>
        <p class="text-center text-xs text-gray-500 dark:text-gray-400">
          建议在重要内容编辑前先备份，或在空白文档中测试效果
        </p>
      </div>

      <!-- 按钮组 -->
      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          class="flex-1"
          @click="beautifyConfirmVisible = false"
        >
          取消
        </Button>
        <Button
          class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex-1 border-0 text-white"
          @click="beautifyMarkdown()"
        >
          <Sparkles class="mr-1 h-4 w-4" />
          开始美化
        </Button>
      </div>
    </div>
  </div>

  <!-- 一键美化加载对话框 -->
  <div
    v-if="beautifyDialogVisible"
    class="backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click="beautifyDialogVisible = false"
  >
    <div
      class="mx-4 max-w-md w-[90vw] scale-100 transform rounded-2xl bg-white p-8 shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 动画图标 -->
      <div class="mb-6 flex justify-center">
        <div class="relative">
          <div class="h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Sparkles class="animate-pulse h-8 w-8 text-blue-500" />
          </div>
          <!-- 旋转光环 -->
          <div class="animate-spin absolute inset-0 h-16 w-16 border-2 border-blue-200 border-t-blue-500 rounded-full dark:border-blue-700" />
        </div>
      </div>

      <!-- 标题 -->
      <h3 class="mb-3 text-center text-xl text-gray-800 font-semibold dark:text-gray-200">
        AI 正在美化您的文档
      </h3>

      <!-- 描述 -->
      <p class="mb-6 text-center text-gray-600 leading-relaxed dark:text-gray-400">
        正在使用人工智能分析您的内容<br>
        智能设置标题层级和格式<br>
        请耐心等待片刻...
      </p>

      <!-- 进度提示 -->
      <div class="space-y-3">
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div class="animate-pulse mr-3 h-2 w-2 rounded-full bg-blue-500" />
          分析文档结构和内容
        </div>
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div class="animate-pulse mr-3 h-2 w-2 rounded-full bg-blue-400" style="animation-delay: 0.2s" />
          智能分段和设置标题
        </div>
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div class="animate-pulse mr-3 h-2 w-2 rounded-full bg-blue-300" style="animation-delay: 0.4s" />
          优化Markdown格式
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
        <p class="text-center text-xs text-gray-500 dark:text-gray-400">
          💡 美化完成后内容将自动替换到编辑器中
        </p>
      </div>
    </div>
  </div>

  <!-- 抓取工具对话框 -->
  <div
    v-if="fetchDialogVisible"
    class="backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click="fetchDialogVisible = false"
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
          class="dark:placeholder-gray-400 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 transition-colors dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          @click="fetchDialogVisible = false"
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

  <!-- 一键改写对话框 -->
  <div
    v-if="rewriteDialogVisible"
    class="backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click="rewriteDialogVisible = false"
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
          @click="rewriteDialogVisible = false"
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

  <!-- 行业信息推送对话框 -->
  <div
    v-if="industryInfoDialogVisible"
    class="backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click="industryInfoDialogVisible = false"
  >
    <div
      class="mx-4 max-w-lg w-[90vw] scale-100 transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 标题图标 -->
      <div class="mb-4 flex items-center justify-center">
        <div class="bg-gradient-to-r from-blue-500 to-cyan-600 h-12 w-12 flex items-center justify-center rounded-full">
          <Newspaper class="h-6 w-6 text-white" />
        </div>
      </div>

      <!-- 标题 -->
      <h3 class="mb-2 text-center text-xl text-gray-900 font-bold dark:text-gray-100">
        一手行业信息推送
      </h3>

      <!-- 描述 -->
      <p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        获取最新的行业资讯和信息推送
      </p>

      <!-- 内容区域 -->
      <div class="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <span class="font-medium">📢 功能说明：</span>
        </p>
        <ul class="space-y-1 mt-2 text-sm text-blue-700 dark:text-blue-300">
          <li>• 实时获取行业最新动态</li>
          <li>• 推送热门资讯和趋势分析</li>
          <li>• 智能筛选相关内容</li>
        </ul>
      </div>

      <!-- 按钮组 -->
      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          class="flex-1"
          @click="industryInfoDialogVisible = false"
        >
          关闭
        </Button>
        <Button
          class="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 flex-1 border-0 text-white"
          @click="industryInfoDialogVisible = false"
        >
          <Newspaper class="mr-1 h-4 w-4" />
          开始使用
        </Button>
      </div>
    </div>
  </div>
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
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
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
