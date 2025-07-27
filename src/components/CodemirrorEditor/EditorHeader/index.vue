<script setup lang="ts">
import {
  Bold,
  ChevronDownIcon,
  Clipboard,
  Copy,
  CreditCard,
  Heading1,
  ImagePlus,
  List,
  ListOrdered,
  Moon,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Redo,
  Settings,
  Sparkles,
  Sun,
  Table,
  Undo,
  Wand2,
} from 'lucide-vue-next'
import { altSign, ctrlKey, ctrlSign, shiftSign, themeOptions } from '@/config'
import { useDisplayStore, useStore } from '@/stores'
import useAIConfigStore from '@/stores/AIConfig'
import { addPrefix, processClipboardContent } from '@/utils'

const emit = defineEmits([`startCopy`, `endCopy`])

const store = useStore()
const displayStore = useDisplayStore()
const aiConfigStore = useAIConfigStore()

const {
  isDark,
  isCiteStatus,
  isCountStatus,
  output,
  primaryColor,
  isOpenPostSlider,
  editor,
  theme,
} = storeToRefs(store)

const {
  toggleDark,
  editorRefresh,
  citeStatusChanged,
  countStatusChanged,
  formatContent,
  themeChanged,
  undo,
  redo,
  copyToClipboard,
  pasteFromClipboard,
  clearContent,
  importDefaultContent,
} = store

// 工具函数，添加格式
function addFormat(cmd: string) {
  const command = (editor.value as any).options.extraKeys[cmd]
  if (typeof command === `function`) {
    command(editor.value)
  }
  else {
    console.warn(`Command ${cmd} not found in extraKeys`)
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
}

const formatItems = [
  {
    label: `加粗`,
    kbd: [ctrlSign, `B`],
    cmd: `${ctrlKey}-B`,
  },
  {
    label: `斜体`,
    kbd: [ctrlSign, `I`],
    cmd: `${ctrlKey}-I`,
  },
  {
    label: `删除线`,
    kbd: [ctrlSign, `D`],
    cmd: `${ctrlKey}-D`,
  },
  {
    label: `超链接`,
    kbd: [ctrlSign, `K`],
    cmd: `${ctrlKey}-K`,
  },
  {
    label: `行内代码`,
    kbd: [ctrlSign, `E`],
    cmd: `${ctrlKey}-E`,
  },
  {
    label: `标题`,
    kbd: [ctrlSign, `H`],
    cmd: `${ctrlKey}-H`,
  },
  {
    label: `无序列表`,
    kbd: [ctrlSign, `U`],
    cmd: `${ctrlKey}-U`,
  },
  {
    label: `有序列表`,
    kbd: [ctrlSign, `O`],
    cmd: `${ctrlKey}-O`,
  },
  {
    label: `格式化`,
    kbd: [altSign, shiftSign, `F`],
    cmd: `formatContent`,
  },
] as const

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
2. 根据内容智能分段并合理设置各级标题（#、##、###等）
3. 适当使用列表、引用、粗体、斜体等格式
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
</script>

<template>
  <header
    class="backdrop-blur-sm header-container sticky top-0 z-50 min-h-15 flex flex-wrap items-center gap-y-1 border-b border-gray-200 bg-white px-2 py-1 sm:h-15 dark:border-gray-700 dark:bg-[#191c20] sm:px-5"
  >
    <!-- 左侧操作区：所有工具按钮 -->
    <div class="space-x-1 sm:space-x-2 w-full flex items-center sm:min-w-0 sm:flex-1">
      <!-- 展开/收起左侧内容栏 -->
      <Button
        variant="outline"
        size="icon"
        @click="isOpenPostSlider = !isOpenPostSlider"
      >
        <PanelLeftOpen v-show="!isOpenPostSlider" class="size-4" />
        <PanelLeftClose v-show="isOpenPostSlider" class="size-4" />
      </Button>

      <!-- 暗色切换 -->
      <Button variant="outline" size="icon" @click="toggleDark()">
        <Moon v-show="isDark" class="size-4" />
        <Sun v-show="!isDark" class="size-4" />
      </Button>

      <!-- 菜单栏 -->
      <Menubar class="compact-mobile menubar">
        <MenubarMenu>
          <MenubarTrigger> 格式</MenubarTrigger>
          <MenubarContent class="w-60" align="start">
            <MenubarCheckboxItem
              v-for="{ label, kbd, cmd } in formatItems"
              :key="label"
              @click="
                cmd === 'formatContent' ? formatContent() : addFormat(cmd)
              "
            >
              {{ label }}
              <MenubarShortcut>
                <kbd
                  v-for="item in kbd"
                  :key="item"
                  class="mx-1 bg-gray-2 dark:bg-stone-9"
                >
                  {{ item }}
                </kbd>
              </MenubarShortcut>
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarCheckboxItem
              :checked="isCiteStatus"
              @click="citeStatusChanged()"
            >
              微信外链转底部引用
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarCheckboxItem
              :checked="isCountStatus"
              @click="countStatusChanged()"
            >
              统计字数和阅读时间
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarCheckboxItem
              @click="displayStore.toggleShowUploadImgDialog()"
            >
              上传图片
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              @click="displayStore.toggleShowInsertFormDialog()"
            >
              插入表格
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              @click="displayStore.toggleShowInsertMpCardDialog()"
            >
              插入公众号名片
            </MenubarCheckboxItem>
            <MenubarSeparator />

            <MenubarCheckboxItem
              @click="importDefaultContent()"
            >
              教学模版文档(覆盖原文)
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              @click="clearContent()"
            >
              清空内容
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
        <StyleDropdown />
      </Menubar>

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

      <!-- 复制粘贴 -->
      <Button
        variant="outline"
        size="icon"
        title="复制选中文本"
        @click="copyToClipboard()"
      >
        <Copy class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        title="粘贴"
        @click="pasteFromClipboard()"
      >
        <Clipboard class="size-4" />
      </Button>

      <!-- 标题级别下拉菜单 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="outline"
            size="icon"
            title="选择标题级别"
          >
            <Heading1 class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" class="w-[120px]">
          <DropdownMenuItem class="flex items-center justify-between" @click="applyHeadingLevel(1)">
            <span>标题 1</span>
            <kbd class="text-xs">Ctrl+1</kbd>
          </DropdownMenuItem>
          <DropdownMenuItem class="flex items-center justify-between" @click="applyHeadingLevel(2)">
            <span>标题 2</span>
            <kbd class="text-xs">Ctrl+2</kbd>
          </DropdownMenuItem>
          <DropdownMenuItem class="flex items-center justify-between" @click="applyHeadingLevel(3)">
            <span>标题 3</span>
            <kbd class="text-xs">Ctrl+3</kbd>
          </DropdownMenuItem>
          <DropdownMenuItem class="flex items-center justify-between" @click="applyHeadingLevel(4)">
            <span>标题 4</span>
            <kbd class="text-xs">Ctrl+4</kbd>
          </DropdownMenuItem>
          <DropdownMenuItem class="flex items-center justify-between" @click="applyHeadingLevel(5)">
            <span>标题 5</span>
            <kbd class="text-xs">Ctrl+5</kbd>
          </DropdownMenuItem>
          <DropdownMenuItem class="flex items-center justify-between" @click="applyHeadingLevel(6)">
            <span>标题 6</span>
            <kbd class="text-xs">Ctrl+6</kbd>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </div>

    <!-- 右侧操作区：手机端第二行显示 -->
    <div class="space-x-1 mt-1 w-full flex items-center justify-start sm:mt-0 sm:w-auto sm:justify-end">
      <!-- 一键美化 -->
      <Button
        variant="outline"
        class="px-3"
        :disabled="isBeautifying"
        title="使用AI智能格式化Markdown文档"
        @click="showBeautifyConfirm()"
      >
        <Sparkles class="mr-1 size-4" />
        {{ isBeautifying ? '美化中...' : '一键美化' }}
      </Button>

      <!-- 文章信息（移动端隐藏） -->
      <div class="hidden sm:inline-flex">
        <PostInfo />
      </div>

      <!-- 右侧菜单栏 -->
      <Menubar class="menubar">
        <!-- 主题选择 -->
        <MenubarMenu>
          <MenubarTrigger>
            <Palette class="mr-1 hidden size-4 sm:inline-block" />
            主题
          </MenubarTrigger>
          <MenubarContent align="end" class="w-[200px]">
            <MenubarRadioGroup :model-value="theme" @update:model-value="themeChanged">
              <MenubarRadioItem
                v-for="option in themeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
                <span v-if="option.desc" class="text-muted-foreground ml-1 text-xs">
                  {{ option.desc }}
                </span>
              </MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>

        <!-- 复制菜单 -->
        <MenubarMenu>
          <MenubarTrigger>
            复制
            <ChevronDownIcon class="ml-1 h-4 w-4" />
          </MenubarTrigger>
          <MenubarContent align="end" class="w-[200px]">
            <MenubarCheckboxItem @click="copyMode = 'txt'; copy()">
              复制公众号格式
            </MenubarCheckboxItem>
            <MenubarCheckboxItem @click="copyMode = 'html'; copy()">
              复制 HTML 格式
            </MenubarCheckboxItem>
            <MenubarCheckboxItem @click="copyMode = 'md'; copy()">
              复制 MD 格式
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarLabel class="text-muted-foreground text-xs">
              当前模式: {{
                copyMode === 'txt' ? '公众号格式'
                : copyMode === 'html' ? 'HTML 格式' : 'MD 格式'
              }}
            </MenubarLabel>
          </MenubarContent>
        </MenubarMenu>

        <!-- 文件菜单 -->
        <FileDropdown />
      </Menubar>

      <!-- 设置按钮 -->
      <Button
        variant="outline"
        size="icon"
        @click="store.isOpenRightSlider = !store.isOpenRightSlider"
      >
        <Settings class="size-4" />
      </Button>
    </div>
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
</template>

<style lang="less" scoped>
.menubar {
  user-select: none;
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
</style>
