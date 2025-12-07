<script setup lang="ts">
import {
  ChevronRight,
  Edit3,
  Ellipsis,
  History,
  PlusSquare,
  Trash2,
} from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useStore } from '@/stores'

interface Post {
  id: string
  title: string
  content: string
  history: {
    datetime: string
    content: string
  }[]
  createDatetime: Date
  updateDatetime: Date
  // 父标签
  parentId?: string | null
  // 展开状态
  collapsed?: boolean
}

const props = defineProps<{
  // 父文章的 ID，如果值是 null，则日表示这是第一层文件
  parentId: string | null
  // 排序好的文章列表
  sortedPosts: Post[]
  // 开始重命名文章
  startRenamePost: (id: string) => void
  // 打开历史记录对话框
  openHistoryDialog: (id: string) => void
  // 开始删除文章
  startDelPost: (id: string) => void
  // 拖拽目的地 ID
  dropTargetId: string | null
  // 设置拖拽目的地
  setDropTargetId: (id: string | null) => void
  // 被拖拽对象
  dragSourceId: string | null
  // 设置被拖拽对象
  setDragSourceId: (id: string | null) => void
  handleDrop: (targetId: string | null) => void
  handleDragEnd: () => void
  // 以添加子文章的方式打开对话框
  openAddPostDialog: (parentId: string) => void
}>()

const store = useStore()

// 点击文章切换并关闭对话框
function handlePostClick(postId: string) {
  store.currentPostId = postId
  // 延迟关闭对话框，确保内容已加载
  setTimeout(() => {
    store.isOpenPostSlider = false
  }, 100)
}

/* ============ 新增内容 ============ */
const isOpenAddDialog = ref(false)
const addPostInputVal = ref(``)
watch(isOpenAddDialog, (o: boolean) => {
  if (o)
    addPostInputVal.value = ``
})

// 新增：拖拽开始时记录ID并设置数据
function handleDragStart(id: string, e: DragEvent) {
  props.setDragSourceId(id)
  e.dataTransfer?.setData(`text/plain`, id)
  e.dataTransfer!.effectAllowed = `move` // 明确拖拽效果
}

/* ============ 折叠展开 ============ */
function togglePostExpanded(postId: string) {
  const targetPost = store.posts.find((p: Post) => p.id === postId)
  if (targetPost) {
    targetPost.collapsed = !targetPost.collapsed
  }
}

/*
 * 判断文章是否有子文章
 */
function isHasChild(postId: string) {
  return props.sortedPosts.some(p => p.parentId === postId)
}
</script>

<template>
  <template v-for="post in props.sortedPosts.filter(p => (props.parentId == null && p.parentId == null) || p.parentId === props.parentId)" :key="post.id">
  <div class="flex items-center gap-0">
    <!-- 折叠展开图标 - 在背景外 -->
    <div class="h-8 w-6 flex flex-shrink-0 items-center justify-center">
      <Button
        v-if="isHasChild(post.id)"
        size="xs"
        variant="ghost"
        class="h-max p-0.5"
        @click.stop="togglePostExpanded(post.id)"
      >
        <!-- 有子文章显示三角形 -->
        <ChevronRight
          class="size-4 transition-transform"
          :class="{ 'rotate-90': !post.collapsed }"
        />
      </Button>
      <!-- 无子文章显示圆点 -->
      <div
        v-else
        class="size-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
      />
    </div>

    <!-- 文章外层容器 -->
    <a
      class="hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-100 w-full inline-flex cursor-pointer items-center gap-1 rounded p-2 text-base transition-colors"
      :class="{
        'bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100 shadow': store.currentPostId === post.id,
        'opacity-50': props.dragSourceId === post.id,
        'outline-2 outline-dashed outline-blue-400 border-gray-200 bg-gray-400/50 dark:border-gray-200 dark:bg-gray-500/50':
          props.dropTargetId === post.id,
      }"
      draggable="true"
      @dragstart="handleDragStart(post.id, $event)"
      @dragend="props.handleDragEnd"
      @drop.prevent="props.handleDrop(post.id)"
      @dragover.stop.prevent="props.setDropTargetId(post.id)"
      @dragleave.prevent="props.setDropTargetId(null)"
      @click="handlePostClick(post.id)"
    >
      <span class="line-clamp-1">{{ post.title }}</span>

      <!-- 每条文章操作 -->
      <DropdownMenu :modal="true">
        <DropdownMenuTrigger as-child>
          <Button
            size="xs"
            variant="ghost"
            class="ml-auto h-max p-0.5"
            @click.stop
          >
            <Ellipsis class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="z-[120]" side="bottom" align="end">
          <DropdownMenuItem @click.stop="props.openAddPostDialog(post.id)">
            <PlusSquare class="mr-2 size-4" /> 新增文章
          </DropdownMenuItem>
          <DropdownMenuItem @click.stop="props.startRenamePost(post.id)">
            <Edit3 class="mr-2 size-4" /> 重命名
          </DropdownMenuItem>
          <DropdownMenuItem @click.stop="props.openHistoryDialog(post.id)">
            <History class="mr-2 size-4" /> 历史记录
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="store.posts.length > 1"
            @click.stop="props.startDelPost(post.id)"
          >
            <Trash2 class="mr-2 size-4" /> 删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </a>
  </div>

  <!-- 子文章容器 - 独立在外层 -->
  <div
    v-if="isHasChild(post.id) && !post.collapsed"
    class="space-y-1 ml-6 mt-1"
  >
    <PostItem
      :parent-id="post.id"
      :sorted-posts="props.sortedPosts"
      :start-rename-post="props.startRenamePost"
      :open-history-dialog="props.openHistoryDialog"
      :start-del-post="props.startDelPost"
      :drag-source-id="props.dragSourceId"
      :set-drag-source-id="props.setDragSourceId"
      :drop-target-id="props.dropTargetId"
      :set-drop-target-id="props.setDropTargetId"
      :handle-drag-end="props.handleDragEnd"
      :handle-drop="props.handleDrop"
      :open-add-post-dialog="props.openAddPostDialog"
    />
  </div>
  </template>
</template>
