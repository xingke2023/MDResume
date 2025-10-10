<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useStore } from '@/stores'

const props = defineProps<{
  open: boolean
  selectedTags: string[]
}>()

const emit = defineEmits<{
  close: []
  update: [tags: string[]]
}>()

const store = useStore()

// 搜索关键词
const searchQuery = ref('')
// 本地选中的标签
const localSelectedTags = ref<string[]>([])

// 监听打开状态，初始化选中的标签
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    localSelectedTags.value = [...props.selectedTags]
    searchQuery.value = ''
  }
})

// 监听本地标签变化，自动保存
watch(localSelectedTags, (newTags) => {
  if (props.open) {
    emit('update', [...newTags])
  }
}, { deep: true })

// 过滤后的标签列表
const filteredTags = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query)
    return store.allTags
  return store.allTags.filter(tag => tag.toLowerCase().includes(query))
})

// 检查搜索词是否完全匹配某个标签
const hasExactMatch = computed(() => {
  const query = searchQuery.value.trim()
  if (!query)
    return true
  return store.allTags.some(tag => tag.toLowerCase() === query.toLowerCase())
})

// 切换标签选中状态
function toggleTag(tag: string) {
  const index = localSelectedTags.value.indexOf(tag)
  if (index > -1) {
    localSelectedTags.value.splice(index, 1)
  }
  else {
    localSelectedTags.value.push(tag)
  }
}

// 创建新标签
function createNewTag() {
  const newTag = searchQuery.value.trim()
  if (!newTag || hasExactMatch.value)
    return

  // 添加到选中列表
  if (!localSelectedTags.value.includes(newTag)) {
    localSelectedTags.value.push(newTag)
  }

  // 清空搜索框
  searchQuery.value = ''
}

// 处理 ESC 键关闭
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
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
            @click.stop="emit('close')"
            @touchend.stop.prevent="emit('close')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <!-- 对话框标题 -->
          <div class="dialog-header">
            <h2 class="dialog-title">选择标签</h2>
          </div>

          <!-- 对话框内容 -->
          <div class="dialog-body">
            <!-- 搜索框 -->
            <div class="search-box">
              <input
                v-model="searchQuery"
                type="text"
                class="search-input"
                placeholder="搜索或创建新标签"
                @keydown.enter="createNewTag"
              >
            </div>

            <!-- 创建新标签提示 -->
            <div v-if="!hasExactMatch && searchQuery.trim()" class="create-tag-hint">
              <button class="create-tag-btn" @click="createNewTag">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                创建新标签 "{{ searchQuery.trim() }}"
              </button>
            </div>

            <!-- 标签列表 -->
            <div class="tags-list">
              <div v-if="filteredTags.length === 0 && hasExactMatch" class="empty-state">
                暂无标签
              </div>
              <label
                v-for="tag in filteredTags"
                :key="tag"
                class="tag-item"
              >
                <input
                  type="checkbox"
                  :checked="localSelectedTags.includes(tag)"
                  class="tag-checkbox"
                  @change="toggleTag(tag)"
                >
                <span class="tag-label">{{ tag }}</span>
              </label>
            </div>
          </div>

          <!-- 对话框底部 -->
          <div class="dialog-footer">
            <div class="selected-count">
              已选择 {{ localSelectedTags.length }} 个标签 · 自动保存
            </div>
          </div>
        </div>
      </div>
    </Transition>
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
  z-index: 1001;
  backdrop-filter: blur(4px);
}

.dialog-container {
  background-color: var(--dialog-bg, #ffffff);
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.dialog-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
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

.dialog-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #212121);
  margin: 0;
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-box {
  position: sticky;
  top: 0;
  background-color: var(--dialog-bg, #ffffff);
  z-index: 10;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text-primary, #212121);
  background: var(--input-bg, #ffffff);
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--primary-color, #3b82f6);
  }

  &::placeholder {
    color: var(--text-secondary, #999);
  }
}

.create-tag-hint {
  margin-top: -0.5rem;
}

.create-tag-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px dashed var(--primary-color, #3b82f6);
  border-radius: 8px;
  background-color: rgba(59, 130, 246, 0.05);
  color: var(--primary-color, #3b82f6);
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:hover {
    background-color: rgba(59, 130, 246, 0.1);
    border-style: solid;
  }

  svg {
    flex-shrink: 0;
  }
}

.tags-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary, #999);
  padding: 2rem 0;
  font-size: 0.875rem;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:hover {
    background-color: var(--hover-bg, #f5f5f5);
  }
}

.tag-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color, #3b82f6);
}

.tag-label {
  flex: 1;
  font-size: 0.9375rem;
  color: var(--text-primary, #212121);
  user-select: none;
}

.dialog-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.selected-count {
  font-size: 0.875rem;
  color: var(--text-secondary, #999);
  flex: 1;
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
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:hover {
    background-color: var(--hover-bg, #f5f5f5);
    border-color: var(--text-secondary, #999);
  }

  &:active {
    transform: scale(0.97);
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

// 深色模式
@media (prefers-color-scheme: dark) {
  .dialog-container {
    --dialog-bg: #2c2c2c;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --border-color: #424242;
    --close-bg: rgba(255, 255, 255, 0.1);
    --close-hover-bg: rgba(255, 255, 255, 0.2);
    --hover-bg: #3c3c3c;
    --input-bg: #1a1a1a;
    --primary-color: #1976d2;
    --primary-hover: #1565c0;
  }
}

// 响应式
@media (max-width: 768px) {
  .dialog-overlay {
    padding: 1rem;
  }

  .dialog-container {
    max-height: 85vh;
  }

  .dialog-header {
    padding: 1.25rem 1.25rem 0.75rem;
  }

  .dialog-body {
    padding: 1.25rem;
  }

  .dialog-footer {
    padding: 0.75rem 1.25rem;
  }

  .dialog-close {
    top: 0.75rem;
    right: 0.75rem;
    width: 36px;
    height: 36px;
  }
}
</style>
