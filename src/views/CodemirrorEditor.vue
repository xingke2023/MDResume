<script setup lang="ts">
import type { Editor } from 'codemirror'
import type { ComponentPublicInstance } from 'vue'
import { fromTextArea } from 'codemirror'
import {
  AIPolishButton,
  AIPolishPopover,
  useAIPolish,
} from '@/components/AIPolish'
import PresetContentPanel from '@/components/CodemirrorEditor/PresetContentPanel.vue'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { SearchTab } from '@/components/ui/search-tab'
import { checkImage, toBase64 } from '@/utils'
import { createExtraKeys } from '@/utils/editor'
import { fileUpload } from '@/utils/file'

const store = useStore()
const displayStore = useDisplayStore()

const { isDark, output, editor, isOpenPresetPanel, isShowMobileToolbar } = storeToRefs(store)
const { editorRefresh } = store

const { toggleShowUploadImgDialog } = displayStore

const backLight = ref(false)
const isCoping = ref(false)
const wasInEditorMode = ref(false)
const showEditor = ref(false) // 默认显示预览模式

function startCopy() {
  backLight.value = true
  isCoping.value = true

  // 如果在移动端编辑模式，临时切换到预览模式
  if (store.isMobile && showEditor.value) {
    wasInEditorMode.value = true
    showEditor.value = false
  }
}

// 拷贝结束
function endCopy() {
  backLight.value = false

  // 恢复到编辑模式
  if (wasInEditorMode.value) {
    showEditor.value = true
    wasInEditorMode.value = false
  }

  setTimeout(() => {
    isCoping.value = false
  }, 800)
}

// 切换编辑/预览视图（仅限移动端）
function toggleView() {
  showEditor.value = !showEditor.value

  // 如果切换到编辑模式，且格式工具栏未展开，则自动展开
  if (showEditor.value && !isShowMobileToolbar.value) {
    isShowMobileToolbar.value = true
  }
}

// 监听主题切换事件（手机端）
onMounted(() => {
  const handleThemeChange = () => {
    if (store.isMobile && showEditor.value) {
      showEditor.value = false
    }
  }
  window.addEventListener(`theme-changed-mobile`, handleThemeChange)

  onUnmounted(() => {
    window.removeEventListener(`theme-changed-mobile`, handleThemeChange)
  })
})

// 动态计算 header 高度，确保不遮蔽编辑区
// 如果初始时工具栏是展开的，使用更大的初始值
const headerHeight = ref(isShowMobileToolbar.value ? 220 : 60)
const editorHeaderRef = useTemplateRef<HTMLElement>(`editorHeaderRef`)

// 更新 header 高度
function updateHeaderHeight() {
  if (editorHeaderRef.value) {
    headerHeight.value = editorHeaderRef.value.offsetHeight
  }
}

// 监听工具栏展开状态变化
watch(isShowMobileToolbar, (newVal) => {
  if (newVal) {
    // 展开时，先设置一个较大的预估值，避免遮蔽
    // 增加到 220px 以容纳更多按钮换行的情况
    headerHeight.value = 220
  }
  else {
    // 收起时，立即设置较小的预估值
    headerHeight.value = 60
  }

  // 使用多次 nextTick 确保 DOM 更新完成
  nextTick(() => {
    nextTick(() => {
      updateHeaderHeight()
      // 在动画期间持续更新，缩短间隔以更快响应
      const timer = setInterval(updateHeaderHeight, 16)
      setTimeout(() => {
        clearInterval(timer)
        updateHeaderHeight() // 最终再确认一次
      }, 500)
    })
  })
})

// 组件挂载后初始化
onMounted(() => {
  nextTick(() => {
    updateHeaderHeight()
    // 使用 ResizeObserver 监听高度变化
    const resizeObserver = new ResizeObserver(() => {
      updateHeaderHeight()
    })
    if (editorHeaderRef.value) {
      resizeObserver.observe(editorHeaderRef.value)
    }
  })
})

const {
  AIPolishBtnRef,
  AIPolishPopoverRef,
  selectedText,
  position,
  isDragging,
  startDrag,
  initPolishEvent,
  recalcPos,
} = useAIPolish()

const previewRef = useTemplateRef<HTMLDivElement>(`previewRef`)

const timeout = ref<NodeJS.Timeout>()

// 使浏览区与编辑区滚动条建立同步联系
function leftAndRightScroll() {
  const scrollCB = (text: string) => {
    // AIPolishBtnRef.value?.close()

    let source: HTMLElement
    let target: HTMLElement

    clearTimeout(timeout.value)
    if (text === `preview`) {
      source = previewRef.value!
      target = document.querySelector<HTMLElement>(`.CodeMirror-scroll`)!

      editor.value!.off(`scroll`, editorScrollCB)
      timeout.value = setTimeout(() => {
        editor.value!.on(`scroll`, editorScrollCB)
      }, 300)
    }
    else {
      source = document.querySelector<HTMLElement>(`.CodeMirror-scroll`)!
      target = previewRef.value!

      target.removeEventListener(`scroll`, previewScrollCB, false)
      timeout.value = setTimeout(() => {
        target.addEventListener(`scroll`, previewScrollCB, false)
      }, 300)
    }

    const percentage
      = source.scrollTop / (source.scrollHeight - source.offsetHeight)
    const height = percentage * (target.scrollHeight - target.offsetHeight)

    target.scrollTo(0, height)
  }

  function editorScrollCB() {
    scrollCB(`editor`)
  }

  function previewScrollCB() {
    scrollCB(`preview`)
  }

  previewRef.value!.addEventListener(`scroll`, previewScrollCB, false)
  editor.value!.on(`scroll`, editorScrollCB)
}

onMounted(() => {
  setTimeout(() => {
    leftAndRightScroll()
  }, 300)
})

const searchTabRef
  = useTemplateRef<InstanceType<typeof SearchTab>>(`searchTabRef`)

function openSearchWithSelection(cm: Editor) {
  const selected = cm.getSelection().trim()
  if (!searchTabRef.value)
    return

  if (selected) {
    // 自动带入选中文本
    searchTabRef.value.setSearchWord(selected)
  }
  else {
    // 仅打开面板
    searchTabRef.value.showSearchTab = true
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === `Escape` && searchTabRef.value?.showSearchTab) {
    searchTabRef.value.showSearchTab = false
    e.preventDefault()
    editor.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener(`keydown`, handleGlobalKeydown)
})

function beforeUpload(file: File) {
  // validate image
  const checkResult = checkImage(file)
  if (!checkResult.ok) {
    toast.error(checkResult.msg)
    return false
  }

  // check image host
  const imgHost = localStorage.getItem(`imgHost`) || `default`
  localStorage.setItem(`imgHost`, imgHost)

  const config = localStorage.getItem(`${imgHost}Config`)
  const isValidHost = imgHost === `default` || config
  if (!isValidHost) {
    toast.error(`请先配置 ${imgHost} 图床参数`)
    return false
  }

  return true
}

// 图片上传结束
function uploaded(imageUrl: string) {
  if (!imageUrl) {
    toast.error(`上传图片未知异常`)
    return
  }
  toggleShowUploadImgDialog(false)

  // 询问是否设置宽度（百分比）
  // eslint-disable-next-line no-alert
  const widthInput = prompt(`设置图片宽度\n输入百分比数字（1-100）：`, `100%`)

  // 上传成功，获取光标
  const cursor = editor.value!.getCursor()
  let markdownImage = `![](${imageUrl})`

  // 如果用户输入了宽度，使用扩展语法
  if (widthInput && widthInput.trim()) {
    // 移除百分号并解析数字
    const widthNum = Number.parseInt(widthInput.trim().replace(`%`, ``))
    if (!Number.isNaN(widthNum) && widthNum > 0 && widthNum <= 100) {
      markdownImage = `![](${imageUrl}{width=${widthNum}%})`
    }
  }

  // 将 Markdown 形式的 URL 插入编辑框光标所在位置
  toRaw(store.editor!).replaceSelection(`\n${markdownImage}\n`, cursor as any)
  toast.success(`图片上传成功`)
}

const isImgLoading = ref(false)

async function uploadImage(
  file: File,
  cb?: { (url: any): void, (arg0: unknown): void } | undefined,
) {
  try {
    isImgLoading.value = true
    toast.loading(`正在上传图片...`, { id: `upload-image` })

    const base64Content = await toBase64(file)
    const url = await fileUpload(base64Content, file)

    toast.dismiss(`upload-image`)

    if (cb) {
      cb(url)
    }
    else {
      uploaded(url)
    }
  }
  catch (err) {
    toast.dismiss(`upload-image`)
    toast.error((err as any).message)
  }
  finally {
    isImgLoading.value = false
  }
}

// 从文件列表中查找一个 md 文件并解析
async function getMd({ list }: { list: { path: string, file: File }[] }) {
  return new Promise<{ str: string, file: File, path: string }>((resolve) => {
    const { path, file } = list.find(item => item.path.match(/\.md$/))!
    const reader = new FileReader()
    reader.readAsText(file!, `UTF-8`)
    reader.onload = (evt) => {
      resolve({
        str: evt.target!.result as string,
        file,
        path,
      })
    }
  })
}

// 转换文件系统句柄中的文件为文件列表
async function showFileStructure(root: any) {
  const result = []
  let cwd = ``
  try {
    const dirs = [root]
    for (const dir of dirs) {
      cwd += `${dir.name}/`
      for await (const [, handle] of dir) {
        if (handle.kind === `file`) {
          result.push({
            path: cwd + handle.name,
            file: await handle.getFile(),
          })
        }
        else {
          result.push({
            path: `${cwd + handle.name}/`,
          })
          dirs.push(handle)
        }
      }
    }
  }
  catch (err) {
    console.error(err)
  }
  return result
}

// 上传 md 中的图片
async function uploadMdImg({
  md,
  list,
}: {
  md: { str: string, path: string, file: File }
  list: { path: string, file: File }[]
}) {
  // 获取所有相对地址的图片
  const mdImgList = [...(md.str.matchAll(/!\[(.*?)\]\((.*?)\)/g) || [])].filter(item => item)
  const root = md.path.match(/.+?\//)![0]
  const resList = await Promise.all<{ matchStr: string, url: string }>(
    mdImgList.map((item) => {
      return new Promise((resolve) => {
        let [, , matchStr] = item
        matchStr = matchStr.replace(/^.\//, ``) // 处理 ./img/ 为 img/ 统一相对路径风格
        const { file }
          = list.find(f => f.path === `${root}${matchStr}`) || {}
        uploadImage(file!, url => resolve({ matchStr, url }))
      })
    }),
  )
  resList.forEach((item) => {
    md.str = md.str
      .replace(`](./${item.matchStr})`, `](${item.url})`)
      .replace(`](${item.matchStr})`, `](${item.url})`)
  })
  editor.value!.setValue(md.str)
}

const codeMirrorWrapper = useTemplateRef<ComponentPublicInstance<HTMLDivElement>>(`codeMirrorWrapper`)

// 转换 markdown 中的本地图片为线上图片
// todo 处理事件覆盖
function mdLocalToRemote() {
  const dom = codeMirrorWrapper.value!

  dom.ondragover = evt => evt.preventDefault()
  dom.ondrop = async (evt) => {
    evt.preventDefault()
    if (evt.dataTransfer == null || !Array.isArray(evt.dataTransfer.items)) {
      return
    }

    for (const item of evt.dataTransfer.items.filter(item => item.kind === `file`)) {
      item
        .getAsFileSystemHandle()
        .then(async (handle: { kind: string, getFile: () => any }) => {
          if (handle.kind === `directory`) {
            const list = (await showFileStructure(handle)) as {
              path: string
              file: File
            }[]
            const md = await getMd({ list })
            uploadMdImg({ md, list })
          }
          else {
            const file = await handle.getFile()
            console.log(`file`, file)
            beforeUpload(file) && uploadImage(file)
          }
        })
    }
  }
}

const changeTimer = ref<NodeJS.Timeout>()

const editorRef = useTemplateRef<HTMLTextAreaElement>(`editorRef`)

function createFormTextArea(dom: HTMLTextAreaElement) {
  const textArea = fromTextArea(dom, {
    mode: `text/x-markdown`,
    theme: isDark.value ? `darcula` : `xq-light`,
    lineNumbers: false,
    lineWrapping: true,
    styleActiveLine: true,
    autoCloseBrackets: true,
    extraKeys: createExtraKeys(openSearchWithSelection),
    undoDepth: 200,
  })

  textArea.on(`change`, (editor) => {
    clearTimeout(changeTimer.value)
    changeTimer.value = setTimeout(() => {
      editorRefresh()

      const currentPost = store.posts[store.currentPostIndex]
      const content = editor.getValue()
      if (content === currentPost.content) {
        return
      }

      currentPost.updateDatetime = new Date()
      currentPost.content = content
    }, 300)
  })

  // 粘贴上传图片并插入
  textArea.on(`paste`, (_editor, event) => {
    if (!(event.clipboardData?.items) || isImgLoading.value) {
      return
    }

    const items = [...event.clipboardData.items].map(item => item.getAsFile()).filter(item => item != null && beforeUpload(item)) as File[]

    for (const item of items) {
      uploadImage(item)
      event.preventDefault()
    }
  })

  return textArea
}

// 初始化编辑器
onMounted(() => {
  const editorDom = editorRef.value

  if (editorDom == null) {
    return
  }

  editorDom.value = store.posts[store.currentPostIndex].content

  nextTick(() => {
    editor.value = createFormTextArea(editorDom)

    initPolishEvent(editor.value)
    editorRefresh()
    mdLocalToRemote()
  })
})

// 监听暗色模式变化并更新编辑器主题
watch(isDark, () => {
  const theme = isDark.value ? `darcula` : `xq-light`
  toRaw(editor.value)?.setOption?.(`theme`, theme)
})

// 历史记录的定时器
const historyTimer = ref<NodeJS.Timeout>()
onMounted(() => {
  // 定时，30 秒记录一次文章的历史记录
  historyTimer.value = setInterval(() => {
    const currentPost = store.posts[store.currentPostIndex]

    // 与最后一篇记录对比
    const pre = (currentPost.history || [])[0]?.content
    if (pre === currentPost.content) {
      return
    }

    currentPost.history ??= []
    currentPost.history.unshift({
      content: currentPost.content,
      datetime: new Date().toLocaleString(`zh-CN`),
    })

    currentPost.history.length = Math.min(currentPost.history.length, 10)
  }, 30 * 1000)
})

// 销毁，清理定时器
onUnmounted(() => {
  clearTimeout(historyTimer.value)
})
</script>

<template>
  <div class="container flex flex-col">
    <EditorHeader
      ref="editorHeaderRef"
      @start-copy="startCopy"
      @end-copy="endCopy"
    />

    <main
      class="container-main flex flex-1 flex-col transition-[padding] duration-300 ease-out"
      :style="{ paddingTop: `${headerHeight}px` }"
    >
      <div
        class="container-main-section border-radius-10 relative flex flex-1 overflow-hidden border-1"
      >
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            v-if="store.isOpenPostSlider"
            :default-size="30"
            :max-size="60"
            :min-size="15"
          >
            <PostSlider />
          </ResizablePanel>
          <ResizableHandle v-if="store.isOpenPostSlider" />
          <ResizablePanel class="flex">
            <div class="flex flex-1">
              <div
                v-show="!store.isMobile || (store.isMobile && showEditor)"
                ref="codeMirrorWrapper"
                class="codeMirror-wrapper relative flex-1"
                :class="{
                  'order-1 border-l': !store.isEditOnLeft,
                  'border-r': store.isEditOnLeft,
                }"
                @click="store.isOpenPresetPanel = false"
              >
                <SearchTab v-if="editor" ref="searchTabRef" :editor="editor" />
                <AIFixedBtn
                  :is-mobile="store.isMobile"
                  :show-editor="showEditor"
                />

                <textarea
                  id="editor"
                  ref="editorRef"
                  type="textarea"
                  placeholder="Your markdown text here."
                />
              </div>
              <div
                v-show="!store.isMobile || (store.isMobile && !showEditor)"
                class="relative flex-1 overflow-x-hidden transition-width"
                :class="[store.isOpenRightSlider ? 'w-0' : 'w-100']"
              >
                <div
                  id="preview"
                  ref="previewRef"
                  class="preview-wrapper w-full p-5"
                >
                  <div
                    id="output-wrapper"
                    class="w-full"
                    :class="{ output_night: !backLight }"
                  >
                    <div
                      class="preview border-x-1 shadow-xl"
                      :class="[store.previewWidth]"
                    >
                      <section id="output" class="w-full" v-html="output" />
                      <div v-if="isCoping" class="loading-mask">
                        <div class="loading-mask-box">
                          <div class="loading__img" />
                          <span>正在生成</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <BackTop
                    target="preview"
                    :right="store.isMobile ? 24 : 20"
                    :bottom="store.isMobile ? 90 : 20"
                  />
                </div>

                <FloatingToc />
              </div>
              <CssEditor class="order-2 flex-1" />
              <RightSlider class="order-2" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <!-- 移动端浮动按钮组 -->
      <div v-if="store.isMobile && !store.isOpenPostSlider" class="fixed right-[1px] top-[40px] z-50 flex flex-col gap-2">
        <!-- 切换编辑/预览按钮 -->
        <button
          class="backdrop-blur-sm h-12 w-12 flex items-center justify-center rounded-full bg-green-600 text-xs text-white font-medium shadow-lg transition active:scale-95 hover:scale-105 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800"
          aria-label="切换编辑/预览"
          @click="toggleView"
        >
          {{ showEditor ? '预览' : '编辑' }}
        </button>
      </div>

      <AIPolishButton
        v-if="store.showAIToolbox"
        ref="AIPolishBtnRef"
        :position="position"
        @click="AIPolishPopoverRef?.show"
      />

      <AIPolishPopover
        v-if="store.showAIToolbox"
        ref="AIPolishPopoverRef"
        :position="position"
        :selected-text="selectedText"
        :is-dragging="isDragging"
        :is-mobile="store.isMobile"
        @close-btn="AIPolishBtnRef?.close"
        @recalc-pos="recalcPos"
        @start-drag="startDrag"
      />

      <UploadImgDialog @upload-image="uploadImage" />

      <InsertFormDialog />

      <InsertMpCardDialog />

      <AlertDialog v-model:open="store.isOpenConfirmDialog">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>提示</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将丢失本地自定义样式，是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction @click="store.resetStyle()">
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>

    <!-- 预设内容面板 - 悬浮层 -->
    <transition name="slide-from-left">
      <PresetContentPanel v-if="isOpenPresetPanel" />
    </transition>

    <Footer />
  </div>
</template>

<style lang="less" scoped>
@import url('../assets/less/app.less');
</style>

<style lang="less" scoped>
.container {
  height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  padding: 0;
}

.container-main {
  overflow: hidden;
}

#output-wrapper {
  position: relative;
  user-select: text;
  height: 100%;
}

.loading-mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  text-align: center;
  color: hsl(var(--foreground));
  background-color: hsl(var(--background));

  .loading-mask-box {
    position: sticky;
    top: 50%;
    transform: translateY(-50%);

    .loading__img {
      width: 75px;
      height: 75px;
      background: url('../assets/images/favicon.png') no-repeat;
      margin: 1em auto;
      background-size: cover;
    }
  }
}

:deep(.preview-table) {
  border-spacing: 0;
}

.codeMirror-wrapper,
.preview-wrapper {
  height: 100%;
}

.codeMirror-wrapper {
  overflow-x: hidden;
  height: 100%;
}

/* 从左侧滑入动画 */
.slide-from-left-enter-active,
.slide-from-left-leave-active {
  transition: transform 0.5s ease-out;
}

.slide-from-left-enter-from {
  transform: translateX(-100%);
}

.slide-from-left-leave-to {
  transform: translateX(-100%);
}

.slide-from-left-enter-to,
.slide-from-left-leave-from {
  transform: translateX(0);
}
</style>
