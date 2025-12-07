<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { ArrowUpNarrowWide, ChevronsDownUp, ChevronsUpDown, FileText, PlusSquare, X } from 'lucide-vue-next'
import { computed, nextTick, onMounted, onUnmounted, ref, toRaw, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useStore } from '@/stores'
import { addPrefix } from '@/utils'

const store = useStore()

// ESC 键关闭对话框
function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && store.isOpenPostSlider) {
    store.isOpenPostSlider = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey)
})

// 展开/收起状态
const isAllExpanded = ref(false)

// 切换展开/收起所有文章
function toggleExpandAll() {
  if (isAllExpanded.value) {
    store.collapseAllPosts()
    isAllExpanded.value = false
  }
  else {
    store.expandAllPosts()
    isAllExpanded.value = true
  }
}

/* ============ 新增内容 ============ */
const parentId = ref<string | null>(null)
const isOpenAddDialog = ref(false)
const addPostInputVal = ref(``)
watch(isOpenAddDialog, (o) => {
  if (o) {
    addPostInputVal.value = ``
    parentId.value = null
  }
})

function openAddPostDialog(id: string) {
  isOpenAddDialog.value = true
  nextTick(() => {
    parentId.value = id
  })
}

function addPost() {
  if (!addPostInputVal.value.trim())
    return toast.error(`内容标题不可为空`)
  if (store.posts.some((post: any) => post.title === addPostInputVal.value.trim()))
    return toast.error(`内容标题已存在`)
  store.addPost(addPostInputVal.value.trim(), parentId.value)
  isOpenAddDialog.value = false
  toast.success(`内容新增成功`)
}

/* ============ 重命名 / 删除 / 历史 对象 ============ */
const editId = ref<string | null>(null)
const isOpenEditDialog = ref(false)
const renamePostInputVal = ref(``)

function startRenamePost(id: string) {
  editId.value = id
  renamePostInputVal.value = store.getPostById(id)!.title
  isOpenEditDialog.value = true
}
function renamePost() {
  if (!renamePostInputVal.value.trim()) {
    return toast.error(`内容标题不可为空`)
  }

  if (
    store.posts.some(
      (post: any) => post.title === renamePostInputVal.value.trim() && post.id !== editId.value,
    )
  ) {
    return toast.error(`内容标题已存在`)
  }

  if (renamePostInputVal.value === store.getPostById(editId.value!)?.title) {
    isOpenEditDialog.value = false
    return
  }

  store.renamePost(editId.value!, renamePostInputVal.value.trim())
  toast.success(`内容重命名成功`)
  isOpenEditDialog.value = false
}

const delId = ref<string | null>(null)
const isOpenDelPostConfirmDialog = ref(false)

const delConfirmText = computed(() => {
  const title = store.getPostById(delId.value || ``)?.title ?? ``
  const short = title.length > 20 ? `${title.slice(0, 20)}…` : title
  return `此操作将删除「${short}」，是否继续？`
})

function startDelPost(id: string) {
  delId.value = id
  isOpenDelPostConfirmDialog.value = true
}
function delPost() {
  store.delPost(delId.value!)
  isOpenDelPostConfirmDialog.value = false
  toast.success(`内容删除成功`)
}

/* ============ 历史记录 ============ */
const isOpenHistoryDialog = ref(false)
const currentPostId = ref<string | null>(null)
const currentHistoryIndex = ref(0)

function openHistoryDialog(id: string) {
  currentPostId.value = id
  currentHistoryIndex.value = 0
  isOpenHistoryDialog.value = true
}
function recoverHistory() {
  const post = store.getPostById(currentPostId.value!)
  if (!post) {
    isOpenHistoryDialog.value = false
    return
  }

  const content = post.history[currentHistoryIndex.value].content
  post.content = content
  toRaw(store.editor!).setValue(content)
  toast.success(`记录恢复成功`)
  isOpenHistoryDialog.value = false
}

/* ============ 筛选笔记 ============ */
const showNotesOnly = ref(false)

function toggleNotesFilter() {
  showNotesOnly.value = !showNotesOnly.value
}

/* ============ 排序 ============ */
const sortMode = useStorage(addPrefix(`sort_mode`), `create-old-new`)
const sortedPosts = computed(() => {
  // 先筛选，再排序
  let posts = [...store.posts]

  // 如果开启了笔记筛选，只显示笔记
  if (showNotesOnly.value) {
    posts = posts.filter(p => p.parentId === store.NOTES_PARENT_ID)
  }

  return posts.sort((a, b) => {
    switch (sortMode.value) {
      case `A-Z`:
        return a.title.localeCompare(b.title)
      case `Z-A`:
        return b.title.localeCompare(a.title)
      case `update-new-old`:
        return +new Date(b.updateDatetime) - +new Date(a.updateDatetime)
      case `update-old-new`:
        return +new Date(a.updateDatetime) - +new Date(b.updateDatetime)
      case `create-new-old`:
        return +new Date(b.createDatetime) - +new Date(a.createDatetime)
      default:
        /* create-old-new */
        return +new Date(a.createDatetime) - +new Date(b.createDatetime)
    }
  })
})

/* ============ 拖拽功能 ============ */
const dragover = ref(false)
const dragSourceId = ref<string | null>(null)
const dropTargetId = ref<string | null>(null)

function handleDrop(targetId: string | null) {
  const sourceId = dragSourceId.value
  if (!sourceId) {
    return
  }

  // 递归检索 ID，是不是父文件拖拽到了子文件上面
  const isParent = (id: string | null | undefined) => {
    if (!id) {
      return false
    }

    const post = store.getPostById(id)
    if (!post) {
      return false
    }

    if (post.parentId === sourceId) {
      return true
    }

    return isParent(post.parentId)
  }

  if (isParent(targetId)) {
    toast.error(`不能将内容拖拽到其子内容下面`)
  }
  else if (sourceId !== targetId) {
    store.updatePostParentId(sourceId, targetId || null)
  }

  dragSourceId.value = null
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleDragEnd() {
  dragSourceId.value = null
  dropTargetId.value = null
  dragover.value = false
}
</script>

<template>
  <!-- 弹出对话框模式 - 替代原有的侧边栏 -->
  <div
    v-if="store.isOpenPostSlider"
    class="backdrop-blur-sm fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
    @click="store.isOpenPostSlider = false"
  >
    <div
      class="h-[85vh] max-w-4xl w-full flex flex-col scale-100 transform rounded-2xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800"
      :class="{
        'border-2 border-dashed border-gray-700 bg-gray-400/50 dark:border-gray-200 dark:bg-gray-500/50': dragover,
      }"
      @click.stop
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
      @dragend="handleDragEnd"
    >
    <nav
      class="h-full flex flex-col overflow-hidden p-1"
      @dragover="handleDragOver"
      @drop.prevent="handleDrop(null)"
    >
      <!-- 顶部：新增 + 排序按钮 -->
      <div class="mb-4 flex shrink-0 items-center justify-between gap-3 px-2">
        <!-- 左侧：新增按钮 - 显著位置 -->
        <Dialog v-model:open="isOpenAddDialog">
          <DialogTrigger>
            <Button
              class="from-blue-500 to-blue-600 bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 h-8 flex items-center gap-2 border-0 px-3 py-1 text-white shadow-md transition-all hover:shadow-lg"
            >
              <PlusSquare class="size-4" />
              <span class="text-sm font-medium">新增文章</span>
            </Button>
          </DialogTrigger>
            <DialogContent class="z-[120] w-[90vw] max-w-md">
              <DialogHeader>
                <DialogTitle class="text-base">文章标题</DialogTitle>
              </DialogHeader>
              <Input v-model="addPostInputVal" @keyup.enter="addPost" placeholder="请输入文章标题" />
              <DialogFooter>
                <Button @click="addPost">
                  确 定
                </Button>
              </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- 右侧：工具按钮组 -->
        <div class="flex items-center gap-2">
          <!-- 笔记筛选按钮 -->
          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="xs"
                  class="h-max px-2 py-1 flex items-center gap-1"
                  :class="{ 'bg-blue-100 dark:bg-blue-900': showNotesOnly }"
                  @click="toggleNotesFilter"
                >
                  <FileText class="size-4" />
                  <span class="text-xs">笔记</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {{ showNotesOnly ? '显示全部文章' : '只显示笔记' }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <!-- 排序 -->
          <DropdownMenu :modal="true">
            <DropdownMenuTrigger>
              <TooltipProvider :delay-duration="200">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="xs" class="h-max p-1">
                      <ArrowUpNarrowWide class="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    排序模式
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="z-[120]" side="bottom" align="end">
              <DropdownMenuRadioGroup v-model="sortMode">
                <DropdownMenuRadioItem value="A-Z">
                  文件名（A-Z）
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Z-A">
                  文件名（Z-A）
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="update-new-old">
                  编辑时间（新→旧）
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="update-old-new">
                  编辑时间（旧→新）
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="create-new-old">
                  创建时间（新→旧）
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="create-old-new">
                  创建时间（旧→新）
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="xs" class="h-max p-1" @click="toggleExpandAll">
                  <ChevronsDownUp v-if="isAllExpanded" class="size-5" />
                  <ChevronsUpDown v-else class="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {{ isAllExpanded ? '全部收起' : '全部展开' }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <!-- 关闭按钮 -->
          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="hover:bg-red-100 dark:hover:bg-red-900/30"
                  @click="store.isOpenPostSlider = false"
                >
                  <X class="size-5 text-red-500 dark:text-red-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                关闭
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <!-- 列表 -->
      <div class="space-y-1 flex-1 overflow-y-auto px-1">
        <!-- 包裹根文章和子文章，保持间距 -->
        <!-- 如果显示笔记，显示所有笔记（parentId = notes-parent）；否则显示顶级文章（parentId = null） -->
        <PostItem
          :parent-id="showNotesOnly ? store.NOTES_PARENT_ID : null"
          :sorted-posts="sortedPosts"
          :start-rename-post="startRenamePost"
          :open-history-dialog="openHistoryDialog"
          :start-del-post="startDelPost"
          :drop-target-id="dropTargetId"
          :set-drop-target-id="(id: string | null) => (dropTargetId = id)"
          :drag-source-id="dragSourceId"
          :set-drag-source-id="(id: string | null) => (dragSourceId = id)"
          :handle-drop="handleDrop"
          :handle-drag-end="handleDragEnd"
          :open-add-post-dialog="openAddPostDialog"
        />
      </div>

      <!-- 重命名弹窗 -->
      <Dialog v-model:open="isOpenEditDialog">
        <DialogContent class="z-[120] w-[90vw] max-w-md sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle class="text-base">编辑文章标题</DialogTitle>
          </DialogHeader>
          <Input v-model="renamePostInputVal" @keyup.enter="renamePost" placeholder="请输入文章标题" />
          <DialogFooter>
            <Button variant="outline" @click="isOpenEditDialog = false">
              取消
            </Button>
            <Button @click="renamePost">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- 删除确认 -->
      <AlertDialog v-model:open="isOpenDelPostConfirmDialog">
        <AlertDialogContent class="z-[120] w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>提示</AlertDialogTitle>
            <AlertDialogDescription>{{ delConfirmText }}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction @click="delPost">
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <!-- 历史记录 -->
      <Dialog v-model:open="isOpenHistoryDialog">
        <DialogContent class="z-[120] w-[95vw] max-w-[95vw] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>历史记录</DialogTitle>
            <DialogDescription>每隔 30 秒自动保存，最多保留 10 条</DialogDescription>
          </DialogHeader>

          <div class="flex h-[60vh] flex-col gap-3 sm:h-[50vh] sm:flex-row">
            <!-- 左侧时间轴 -->
            <ul class="flex h-auto shrink-0 gap-2 overflow-x-auto pb-2 sm:h-full sm:w-[150px] sm:flex-col sm:space-y-2 sm:overflow-x-visible sm:pb-0">
              <li
                v-for="(item, idx) in store.getPostById(currentPostId!)?.history"
                :key="item.datetime"
                class="hover:text-primary-foreground hover:bg-primary/90 inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded px-3 text-sm transition-colors sm:w-full sm:px-2"
                :class="{
                  'bg-primary text-primary-foreground shadow-lg dark:border dark:border-primary':
                    currentHistoryIndex === idx,
                  'dark:bg-gray/30 dark:text-primary-foreground-dark dark:border-primary-dark':
                    currentHistoryIndex === idx,
                }"
                @click="currentHistoryIndex = idx"
              >
                {{ item.datetime }}
              </li>
            </ul>

            <Separator orientation="vertical" class="mx-2 hidden sm:block" />
            <Separator class="sm:hidden" />

            <!-- 右侧内容 -->
            <div class="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
              <pre class="max-w-full whitespace-pre-wrap break-words break-all font-mono text-xs leading-relaxed">{{ store.getPostById(currentPostId!)?.history[currentHistoryIndex].content ?? '' }}</pre>
            </div>
          </div>

          <DialogFooter>
            <AlertDialog>
              <AlertDialogTrigger><Button>恢 复</Button></AlertDialogTrigger>
              <AlertDialogContent class="z-[130] w-[90vw] max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>提示</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将用该记录替换当前文章内容，是否继续？
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction @click="recoverHistory">
                    恢 复
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
    </div>
  </div>
</template>
