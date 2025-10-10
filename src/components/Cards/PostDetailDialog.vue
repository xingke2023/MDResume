<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useStore } from '@/stores'
import TagSelectorDialog from './TagSelectorDialog.vue'

interface Post {
  id: string
  title: string
  content: string
  createDatetime: Date
  updateDatetime: Date
  parentId?: string | null
  tags?: string[]
}

const props = defineProps<{
  post: Post | null
  open: boolean
  isNew?: boolean
}>()

const emit = defineEmits<{
  close: []
  edit: []
  save: [post: Post]
}>()

const store = useStore()

// 生成兼容所有浏览器的 UUID
function generateUUID(): string {
  // 优先使用原生 crypto.randomUUID
  if (typeof crypto !== `undefined` && typeof crypto.randomUUID === `function`) {
    return crypto.randomUUID()
  }

  // 降级方案：使用 Math.random
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === `x` ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 编辑状态
const isEditing = ref(false)
const editTitle = ref(``)
const editContent = ref(``)
const editTags = ref<string[]>([])

// 新建文章时，是否已经创建了文章
const hasCreatedPost = ref(false)
// 新创建的文章ID
const newPostId = ref<string | null>(null)

// 标签选择器状态
const isTagSelectorOpen = ref(false)

// 监听打开状态，渲染内容
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (props.isNew) {
      // 新建模式 - 直接编辑，但还没创建文章
      isEditing.value = true
      editTitle.value = ``
      editContent.value = ``
      editTags.value = []
      hasCreatedPost.value = false
      newPostId.value = null
    }
    else if (props.post) {
      // 查看模式 - 也直接进入编辑
      isEditing.value = true
      editTitle.value = props.post.title
      editContent.value = props.post.content
      editTags.value = props.post.tags ? [...props.post.tags] : []
      hasCreatedPost.value = false
      newPostId.value = null
    }
  }
}, { immediate: true })

// 自动创建新文章 - 当输入第一个字符时
function createNewPostIfNeeded() {
  if (!props.isNew || hasCreatedPost.value)
    return

  // 只有在有内容时才创建
  if (!editTitle.value && !editContent.value)
    return

  // 生成默认标题：当前日期时间
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const hours = String(now.getHours()).padStart(2, `0`)
  const minutes = String(now.getMinutes()).padStart(2, `0`)
  const defaultTitle = editTitle.value || `${month}月${day}日 ${hours}:${minutes}`

  // 创建新文章
  const newPost = {
    id: generateUUID(),
    title: defaultTitle,
    content: editContent.value,
    history: [
      { datetime: now.toLocaleString(`zh-cn`), content: editContent.value },
    ],
    createDatetime: now,
    updateDatetime: now,
    parentId: store.NOTES_PARENT_ID, // 所有卡片视图创建的文章都是"笔记"的子文章
    tags: [...editTags.value], // 包含标签
  }

  store.posts.push(newPost)
  hasCreatedPost.value = true
  newPostId.value = newPost.id

  console.log(`新建文章已创建:`, newPost)
}

// 自动保存 - 监听标题变化
watch(editTitle, (newTitle) => {
  console.log(`标题变化:`, newTitle)
  if (!props.open) {
    console.log(`对话框未打开，跳过`)
    return
  }

  if (props.isNew) {
    console.log(`新建模式`)
    // 新建模式：输入第一个字符时创建文章
    createNewPostIfNeeded()

    // 如果已经创建了文章，更新标题
    if (hasCreatedPost.value && newPostId.value) {
      const post = store.getPostById(newPostId.value)
      if (post) {
        post.title = newTitle || post.title // 如果标题为空，保持默认标题
        post.updateDatetime = new Date()
        console.log(`标题已更新:`, post.title)
      }
    }
  }
  else if (props.post) {
    console.log(`编辑模式`)
    // 编辑模式：直接更新
    const post = store.getPostById(props.post.id)
    if (post && newTitle !== post.title) {
      post.title = newTitle
      post.updateDatetime = new Date()
      console.log(`标题已更新 (编辑):`, post.title)
    }
  }
})

// 自动保存 - 监听内容变化
watch(editContent, (newContent) => {
  console.log(`内容变化, 长度:`, newContent.length)
  if (!props.open) {
    console.log(`对话框未打开，跳过`)
    return
  }

  if (props.isNew) {
    console.log(`新建模式`)
    // 新建模式：输入第一个字符时创建文章
    createNewPostIfNeeded()

    // 如果已经创建了文章，更新内容
    if (hasCreatedPost.value && newPostId.value) {
      const post = store.getPostById(newPostId.value)
      if (post) {
        post.content = newContent
        post.updateDatetime = new Date()
        console.log(`内容已更新, 长度:`, newContent.length)
      }
    }
  }
  else if (props.post) {
    console.log(`编辑模式`)
    // 编辑模式：直接更新
    const post = store.getPostById(props.post.id)
    if (post && newContent !== post.content) {
      post.content = newContent
      post.updateDatetime = new Date()
      console.log(`内容已更新 (编辑), 长度:`, newContent.length)
    }
  }
})

// 自动保存 - 监听标签变化
watch(editTags, (newTags) => {
  console.log(`标签变化:`, newTags)
  if (!props.open)
    return

  if (props.isNew) {
    // 新建模式：如果已经创建了文章，更新标签
    if (hasCreatedPost.value && newPostId.value) {
      const post = store.getPostById(newPostId.value)
      if (post) {
        post.tags = [...newTags]
        post.updateDatetime = new Date()
        console.log(`标签已更新:`, post.tags)
      }
    }
  }
  else if (props.post) {
    // 编辑模式：直接更新
    const post = store.getPostById(props.post.id)
    if (post) {
      post.tags = [...newTags]
      post.updateDatetime = new Date()
      console.log(`标签已更新 (编辑):`, post.tags)
    }
  }
}, { deep: true })

// 处理 ESC 键关闭
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === `Escape` && props.open) {
    emit(`close`)
  }
}

// 格式化日期
function formatDateTime(date: Date) {
  const d = new Date(date)
  return d.toLocaleString(`zh-CN`, {
    month: `2-digit`,
    day: `2-digit`,
    hour: `2-digit`,
    minute: `2-digit`,
  })
}

// 处理关闭 - 如果新建模式下没有输入任何内容，删除空文章
function handleClose() {
  console.log(`handleClose 被调用`)
  console.log(`props.isNew:`, props.isNew)
  console.log(`hasCreatedPost:`, hasCreatedPost.value)
  console.log(`newPostId:`, newPostId.value)

  if (props.isNew && hasCreatedPost.value && newPostId.value) {
    const post = store.getPostById(newPostId.value)
    console.log(`找到的post:`, post)
    // 如果标题和内容都是空的或只有默认标题，删除这个空文章
    if (post && !post.content.trim()) {
      const idx = store.posts.findIndex(p => p.id === newPostId.value)
      if (idx !== -1) {
        console.log(`删除空文章，索引:`, idx)
        store.posts.splice(idx, 1)
      }
    }
  }
  console.log(`准备emit close`)
  emit(`close`)
  console.log(`emit close 完成`)
}

// 处理删除文章
function handleDelete() {
  if (!props.post && !newPostId.value)
    return

  const confirmed = window.confirm(`确定要删除这篇文章吗？`)
  if (!confirmed)
    return

  // 如果是新建模式，删除新创建的文章
  const postId = props.isNew && newPostId.value ? newPostId.value : props.post?.id
  if (!postId)
    return

  const idx = store.posts.findIndex(p => p.id === postId)
  if (idx !== -1) {
    store.posts.splice(idx, 1)
    console.log(`文章已删除:`, postId)
  }

  emit(`close`)
}

// 处理调色板点击
function handlePalette() {
  // TODO: 实现调色板功能
  console.log(`调色板功能待实现`)
}

// 处理标签按钮点击 - 打开标签选择器
function handleTag() {
  isTagSelectorOpen.value = true
}

// 处理标签选择器更新
function handleTagsUpdate(tags: string[]) {
  editTags.value = tags
}

onMounted(() => {
  window.addEventListener(`keydown`, handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener(`keydown`, handleKeyDown)
})

// 阻止对话框内容点击时关闭
function handleContentClick(e: MouseEvent) {
  e.stopPropagation()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="dialog-overlay" @click="emit('close')">
        <div class="dialog-container" @click="handleContentClick">
          <!-- 关闭按钮 -->
          <button
            class="dialog-close"
            @click.stop="handleClose"
            @touchend.stop.prevent="handleClose"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <!-- 对话框内容 -->
          <div class="dialog-body">
            <!-- 编辑模式 -->
            <div class="edit-mode">
              <input
                v-model="editTitle"
                type="text"
                class="edit-title"
                placeholder="标题"
              >
              <textarea
                v-model="editContent"
                class="edit-content"
                placeholder="内容（支持 Markdown 语法）"
                rows="10"
              />
              <!-- 标签显示区域 -->
              <div v-if="editTags.length > 0" class="tags-display">
                <span
                  v-for="(tag, index) in editTags"
                  :key="index"
                  class="tag-badge"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- 对话框底部 -->
          <div class="dialog-footer">
            <div class="dialog-left-group">
              <div v-if="!isNew && post" class="dialog-meta">
                <div class="meta-item">
                  创建于{{ formatDateTime(post.createDatetime) }}
                </div>
                <div class="meta-item">
                  更新于{{ formatDateTime(post.updateDatetime) }}
                </div>
              </div>
              <div v-else class="dialog-meta">
                <div class="meta-item">
                  新建笔记
                </div>
              </div>
              <div class="dialog-icon-actions">
                <!-- 调色板按钮 -->
                <button
                  class="btn-icon"
                  title="调色板"
                  @click="handlePalette"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                  </svg>
                </button>
                <!-- 标签按钮 -->
                <button
                  class="btn-icon"
                  title="标签"
                  @click="handleTag"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                </button>
                <!-- 删除按钮 -->
                <button
                  class="btn-icon btn-delete"
                  title="删除"
                  @click="handleDelete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="dialog-right-group">
              <!-- 关闭按钮 -->
              <button
                class="btn-text"
                @click="handleClose"
                @touchend.stop.prevent="handleClose"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 标签选择器 -->
    <TagSelectorDialog
      :open="isTagSelectorOpen"
      :selected-tags="editTags"
      @close="isTagSelectorOpen = false"
      @update="handleTagsUpdate"
    />
  </Teleport>
</template>

<style scoped lang="less">
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog-container {
  background-color: var(--dialog-bg, #ffffff);
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  width: 98vw;
  height: 98vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.dialog-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: var(--close-bg, rgba(0, 0, 0, 0.05));
  color: var(--text-primary, #212121);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 100;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:hover {
    background-color: var(--close-hover-bg, rgba(0, 0, 0, 0.1));
    transform: rotate(90deg);
  }

  &:active {
    background-color: var(--close-hover-bg, rgba(0, 0, 0, 0.15));
  }
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.edit-title {
  width: 100%;
  border: none;
  outline: none;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary, #212121);
  background: transparent;
  padding: 0.5rem 0;

  &::placeholder {
    color: var(--text-secondary, #999);
  }
}

.edit-content {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-primary, #212121);
  background: transparent;
  padding: 0.5rem 0;
  resize: vertical;
  min-height: 300px;
  font-family: inherit;

  &::placeholder {
    color: var(--text-secondary, #999);
  }
}

.content-preview {
  color: var(--text-primary, #212121);
  line-height: 1.8;
  font-size: 1rem;

  :deep(h1) {
    font-size: 2rem;
    font-weight: 600;
    margin: 1.5rem 0 1rem 0;
    color: var(--text-primary, #212121);
  }

  :deep(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1.25rem 0 0.75rem 0;
    color: var(--text-primary, #212121);
  }

  :deep(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem 0;
    color: var(--text-primary, #212121);
  }

  :deep(p) {
    margin: 0.75rem 0;
  }

  :deep(strong) {
    font-weight: 600;
    color: var(--text-primary, #212121);
  }

  :deep(em) {
    font-style: italic;
  }

  :deep(code) {
    background-color: var(--code-bg, #f5f5f5);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    font-size: 0.9em;
  }

  :deep(a) {
    color: var(--link-color, #1976d2);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;

    &:hover {
      border-bottom-color: var(--link-color, #1976d2);
    }
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1rem 0;
  }
}

.dialog-footer {
  padding: 0.5rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.dialog-left-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex: 1;
}

.dialog-icon-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.dialog-right-group {
  display: flex;
  align-items: center;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: var(--icon-bg, rgba(0, 0, 0, 0.05));
  color: var(--text-primary, #212121);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:hover {
    background-color: var(--icon-hover-bg, rgba(0, 0, 0, 0.1));
  }

  &:active {
    transform: scale(0.95);
  }

  &.btn-delete {
    &:hover {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }
  }
}

.dialog-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-item {
  font-size: 0.65rem;
  color: var(--text-secondary, #999);
  line-height: 1.2;
}

.btn-text {
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, #e0e0e0);
  background-color: transparent;
  color: var(--text-primary, #212121);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:hover {
    background-color: var(--hover-bg, #f5f5f5);
    border-color: var(--text-secondary, #999);
  }

  &:active {
    transform: scale(0.97);
    background-color: var(--hover-bg, #f5f5f5);
  }

  &.btn-primary {
    background-color: var(--primary-color, #3b82f6);
    border-color: var(--primary-color, #3b82f6);
    color: #ffffff;

    &:hover {
      background-color: var(--primary-hover, #2563eb);
      border-color: var(--primary-hover, #2563eb);
    }
  }
}

// 过渡动画
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;

  .dialog-container {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;

  .dialog-container {
    transform: scale(0.95) translateY(20px);
  }
}

// 标签样式
.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  margin-left: -8px;
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  background-color: var(--tag-bg, #f5f5f5);
  color: var(--text-secondary, #6b7280);
  border-radius: 12px;
  border: 1px solid var(--tag-border, #d1d5db);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
}

// 深色模式
@media (prefers-color-scheme: dark) {
  .dialog-container {
    --dialog-bg: #2c2c2c;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --border-color: #424242;
    --close-bg: rgba(255, 255, 255, 0.1);
    --close-hover-bg: rgba(255, 255, 255, 0.2);
    --icon-bg: rgba(255, 255, 255, 0.1);
    --icon-hover-bg: rgba(255, 255, 255, 0.2);
    --hover-bg: #3c3c3c;
    --code-bg: #1a1a1a;
    --link-color: #64b5f6;
    --primary-color: #1976d2;
    --primary-hover: #1565c0;
    --tag-bg: #3c3c3c;
    --tag-border: #525252;
  }
}

// 响应式
@media (max-width: 768px) {
  .dialog-overlay {
    padding: 1rem;
  }

  .dialog-container {
    max-height: 90vh;
  }

  .dialog-body {
    padding: 1.5rem;
    padding-bottom: 0rem;
  }

  .dialog-footer {
    padding: 0.4rem 1rem;
  }

  .dialog-meta {
    gap: 0.2rem;
  }

  .meta-item {
    font-size: 0.6rem;
  }

  .btn-text {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .dialog-close {
    top: 1rem;
    right: 1rem;
  }

  .btn-icon {
    width: 40px;
    height: 40px;

    svg {
      width: 22px;
      height: 22px;
    }
  }
}
</style>
