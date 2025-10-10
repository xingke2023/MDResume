<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import PostCard from '@/components/Cards/PostCard.vue'
import PostDetailDialog from '@/components/Cards/PostDetailDialog.vue'
import { useStore } from '@/stores'

// 定义 emits
defineEmits([`navigate`])

const store = useStore()

// 当前选中的卡片
const selectedPostId = ref<string | null>(null)
const isDetailDialogOpen = ref(false)
const isNewPost = ref(false)

// 搜索关键词
const searchQuery = ref(``)

// 展开状态管理（使用 Map 来管理每个日期的展开状态）
const expandedDates = ref<Map<string, boolean>>(new Map())

// 视图模式：'masonry' 瀑布流 | 'timeline' 时间轴 | 'list' 列表
const viewMode = ref<`masonry` | `timeline` | `list`>(`masonry`)

// 标签弹窗显示状态
const showTagsPopup = ref(false)

// 示例标签数据
const sampleTags = ref([
  { id: '1', name: '工作', color: '#3b82f6', count: 12 },
  { id: '2', name: '学习', color: '#10b981', count: 8 },
  { id: '3', name: '生活', color: '#f59e0b', count: 15 },
  { id: '4', name: '想法', color: '#8b5cf6', count: 6 },
  { id: '5', name: '待办', color: '#ef4444', count: 9 },
  { id: '6', name: '灵感', color: '#ec4899', count: 4 },
])

// 瀑布流布局相关
let resizeObserver: ResizeObserver | null = null

// 获取所有根级别的文章（没有父节点的）用于卡片展示，按创建时间倒序排列（从新到旧）
const rootPosts = computed(() => {
  return store.posts
    .filter(post => !post.parentId)
    .sort((a, b) => {
      const timeA = new Date(a.createDatetime).getTime()
      const timeB = new Date(b.createDatetime).getTime()
      return timeB - timeA // 倒序：最新的在前面（显示在最上面）
    })
})

// 根据搜索关键词过滤的文章
const filteredPosts = computed(() => {
  let posts = rootPosts.value

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    posts = posts.filter(post =>
      post.title.toLowerCase().includes(query)
      || post.content.toLowerCase().includes(query),
    )
  }

  return posts
})

// 获取本地日期字符串（YYYY-MM-DD 格式，考虑时区）
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, `0`)
  const day = String(date.getDate()).padStart(2, `0`)
  return `${year}-${month}-${day}`
}

// 时间轴视图：按日期分组，今天的文章全部展开，以往的文章折叠
const postsByDate = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = getLocalDateString(today)

  // 调试日志
  console.log(`今天的日期字符串 (北京时间):`, todayStr)

  // 按日期分组
  const dateGroups = new Map<string, typeof filteredPosts.value>()

  // 从旧到新排序（反转数组）
  const sortedPosts = [...filteredPosts.value].reverse()

  sortedPosts.forEach((post) => {
    const postDate = new Date(post.createDatetime)
    const dateStr = getLocalDateString(postDate)
    if (!dateGroups.has(dateStr)) {
      dateGroups.set(dateStr, [])
    }
    dateGroups.get(dateStr)!.push(post)
  })

  // 按日期从旧到新排序
  const sortedDates = Array.from(dateGroups.keys()).sort()

  const groups = sortedDates.map((dateStr) => {
    const posts = dateGroups.get(dateStr)!
    // 同一天内的文章也按创建时间从旧到新排序（最旧的在下面，最新的在上面）
    posts.sort((a, b) => {
      return new Date(a.createDatetime).getTime() - new Date(b.createDatetime).getTime()
    })

    const isToday = dateStr === todayStr

    // 调试日志
    console.log(`日期: ${dateStr}, 是否是今天: ${isToday}, 格式化显示: ${formatTimelineDate(dateStr)}`)

    // 检查是否有手动设置的展开状态
    // 今天的文章：默认展开，但允许手动折叠
    // 以往的文章：默认折叠，可以手动展开
    const expanded = expandedDates.value.get(dateStr) ?? isToday
    console.log(`日期 ${dateStr} (${isToday ? `今天` : `以往`}) 的展开状态: ${expanded}`)

    return {
      date: dateStr,
      displayDate: formatTimelineDate(dateStr),
      isToday,
      expanded,
      posts,
      postCount: posts.length,
    }
  })

  return groups
})

// 切换日期组的展开状态
function toggleDateGroup(dateStr: string) {
  const currentState = expandedDates.value.get(dateStr)

  // 获取今天的日期字符串（本地时间）
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = getLocalDateString(today)
  const isToday = dateStr === todayStr

  // 如果没有手动设置过状态，使用默认值（今天默认展开，其他默认折叠）
  const defaultState = !!isToday
  const stateToToggle = currentState ?? defaultState

  expandedDates.value.set(dateStr, !stateToToggle)
}

// 格式化时间轴日期（返回对象包含多行信息）
function formatTimelineDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const postDate = new Date(date)
  postDate.setHours(0, 0, 0, 0)

  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = [`周日`, `周一`, `周二`, `周三`, `周四`, `周五`, `周六`]
  const weekday = weekdays[date.getDay()]

  let label = ``
  if (postDate.getTime() === today.getTime()) {
    label = `今天`
  }
  else if (postDate.getTime() === yesterday.getTime()) {
    label = `昨天`
  }

  return {
    label, // '今天' 或 '昨天' 或空字符串
    date: `${month}月${day}日`,
    weekday,
  }
}

// 格式化时间轴的时间（几点几分）
function formatTimelineTime(datetime: Date) {
  const date = new Date(datetime)
  const hours = String(date.getHours()).padStart(2, `0`)
  const minutes = String(date.getMinutes()).padStart(2, `0`)
  return `${hours}:${minutes}`
}

// 处理卡片点击
function handleCardClick(postId: string) {
  selectedPostId.value = postId
  isNewPost.value = false
  isDetailDialogOpen.value = true
}

// 处理新建文章
function handleNewPost() {
  selectedPostId.value = null
  isNewPost.value = true
  isDetailDialogOpen.value = true
}

// 关闭详情对话框
function handleCloseDialog() {
  isDetailDialogOpen.value = false
  selectedPostId.value = null
  isNewPost.value = false
}

// 获取选中的文章
const selectedPost = computed(() => {
  if (!selectedPostId.value)
    return null
  return store.getPostById(selectedPostId.value)
})

// 切换视图模式（循环切换：瀑布流 -> 时间轴 -> 列表 -> 瀑布流）
function toggleViewMode() {
  if (viewMode.value === `masonry`) {
    viewMode.value = `timeline`
  }
  else if (viewMode.value === `timeline`) {
    viewMode.value = `list`
  }
  else {
    viewMode.value = `masonry`
    nextTick(() => {
      layoutMasonry()
    })
  }
}

// 瀑布流布局算法
function layoutMasonry() {
  const container = document.querySelector(`.cards-masonry`) as HTMLElement
  if (!container)
    return

  const cards = Array.from(container.children) as HTMLElement[]
  if (cards.length === 0)
    return

  // 获取容器宽度和间距
  const containerWidth = container.offsetWidth
  const gap = 8 // 0.5rem = 8px，更紧凑

  // 根据屏幕宽度确定列数
  let columns = 4
  if (window.innerWidth <= 360)
    columns = 2
  else if (window.innerWidth <= 768)
    columns = 2
  else if (window.innerWidth <= 1200)
    columns = 3

  // 计算每列宽度
  const columnWidth = (containerWidth - gap * (columns - 1)) / columns

  // 初始化每列的高度数组
  const columnHeights = Array.from({ length: columns }, () => 0)

  // 为每个卡片设置位置
  cards.forEach((card) => {
    // 找到当前最短的列
    const minHeight = Math.min(...columnHeights)
    const minColumn = columnHeights.indexOf(minHeight)

    // 计算卡片位置
    const left = minColumn * (columnWidth + gap)
    const top = columnHeights[minColumn]

    // 设置卡片样式
    card.style.position = `absolute`
    card.style.left = `${left}px`
    card.style.top = `${top}px`
    card.style.width = `${columnWidth}px`

    // 更新该列的高度
    columnHeights[minColumn] += card.offsetHeight + gap
  })

  // 设置容器高度为最高列的高度
  const maxHeight = Math.max(...columnHeights)
  container.style.height = `${maxHeight}px`
  container.style.position = `relative`
}

// 监听窗口大小变化，重新布局
function handleResize() {
  if (viewMode.value === `masonry`) {
    layoutMasonry()
  }
}

// 监听 filteredPosts 变化，重新布局
watch(filteredPosts, () => {
  if (viewMode.value === `masonry`) {
    nextTick(() => {
      layoutMasonry()
    })
  }
})

// 组件挂载时初始化
onMounted(() => {
  nextTick(() => {
    layoutMasonry()
  })

  window.addEventListener(`resize`, handleResize)

  // 使用 ResizeObserver 监听卡片大小变化
  const container = document.querySelector(`.cards-masonry`)
  if (container) {
    resizeObserver = new ResizeObserver(() => {
      if (viewMode.value === `masonry`) {
        layoutMasonry()
      }
    })
    resizeObserver.observe(container)
  }
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener(`resize`, handleResize)
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div class="cards-view-container">
    <!-- 顶部导航栏 -->
    <header class="cards-header">
      <div class="header-content">
        <!-- 标签按钮 -->
        <button
          class="header-btn"
          title="标签"
          @click="showTagsPopup = !showTagsPopup"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        </button>

        <div class="search-container">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索笔记"
          >
        </div>

        <div class="header-actions">
          <button
            class="header-btn"
            :title="viewMode === 'masonry' ? '时间轴视图' : viewMode === 'timeline' ? '列表视图' : '瀑布流视图'"
            @click="toggleViewMode"
          >
            <!-- 瀑布流图标（当前是列表模式时显示） -->
            <svg v-if="viewMode === 'list'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <!-- 时间轴图标（当前是瀑布流模式时显示） -->
            <svg v-else-if="viewMode === 'masonry'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="2" />
              <circle cx="12" cy="16" r="2" />
              <line x1="12" y1="10" x2="12" y2="14" />
              <line x1="12" y1="3" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="21" />
            </svg>
            <!-- 列表图标（当前是时间轴模式时显示） -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button
            class="header-btn"
            title="关闭"
            @click="$emit('navigate', 'editor')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- 标签弹窗 -->
    <Teleport to="body">
      <div v-if="showTagsPopup" class="tags-popup-overlay" @click="showTagsPopup = false">
        <div class="tags-popup" @click.stop>
          <div class="tags-popup-header">
            <h3>所有标签</h3>
            <button class="tags-popup-close" @click="showTagsPopup = false">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="tags-popup-content">
            <button
              v-for="tag in sampleTags"
              :key="tag.id"
              class="tag-item"
              :style="{ '--tag-color': tag.color }"
              @click="() => { console.log('选择标签:', tag.name); showTagsPopup = false }"
            >
              <span class="tag-name">{{ tag.name }}</span>
              <span class="tag-count">{{ tag.count }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 卡片网格 -->
    <main class="cards-main">
      <h2 v-if="filteredPosts.length > 0" class="section-title">
        记事本
      </h2>

      <div v-if="filteredPosts.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <p class="empty-text">
          {{ searchQuery ? '没有找到匹配的笔记' : '还没有笔记' }}
        </p>
        <p class="empty-hint">
          {{ searchQuery ? '试试其他搜索词' : '点击左上角按钮返回编辑器创建笔记' }}
        </p>
      </div>

      <!-- 瀑布流布局 -->
      <div v-else-if="viewMode === 'masonry'" class="cards-masonry">
        <PostCard
          v-for="post in filteredPosts"
          :key="post.id"
          :post="post"
          @card-click="handleCardClick"
        />
      </div>

      <!-- 时间轴布局 -->
      <div v-else-if="viewMode === 'timeline'" class="cards-timeline">
        <div v-for="(group, index) in postsByDate" :key="`${group.date}-${index}`" class="timeline-group" :class="{ 'is-collapsed': !group.expanded }">
          <div
            class="timeline-date is-clickable"
            @click="toggleDateGroup(group.date)"
          >
            <div class="timeline-date-badge">
              <div v-if="group.displayDate.label" class="timeline-date-label">
                {{ group.displayDate.label }}
              </div>
              <div class="timeline-date-text">
                {{ group.displayDate.date }}
              </div>
              <div class="timeline-date-weekday">
                {{ group.displayDate.weekday }}
              </div>
              <div class="timeline-post-count">
                {{ group.postCount }} 篇
              </div>
              <div class="timeline-toggle-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :style="{ transform: group.expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
          <div v-if="group.expanded" class="timeline-content">
            <!-- 使用 slice().reverse() 让文章在视觉上从下至上排列（最旧的在下面） -->
            <div v-for="post in [...group.posts].reverse()" :key="post.id" class="timeline-item">
              <div class="timeline-item-time">
                {{ formatTimelineTime(post.createDatetime) }}
              </div>
              <div class="timeline-item-card">
                <PostCard
                  :post="post"
                  @card-click="handleCardClick"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 列表布局 -->
      <div v-else class="cards-list">
        <PostCard
          v-for="post in filteredPosts"
          :key="post.id"
          :post="post"
          @card-click="handleCardClick"
        />
      </div>
    </main>

    <!-- 详情对话框 -->
    <PostDetailDialog
      :post="selectedPost"
      :open="isDetailDialogOpen"
      :is-new="isNewPost"
      @close="handleCloseDialog"
      @edit="() => {
        store.currentPostId = selectedPostId!
        $emit('navigate', 'editor')
      }"
    />

    <!-- 右下角新增按钮 -->
    <button class="fab-button" @click="handleNewPost">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
</template>

<style scoped lang="less">
.cards-view-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color, #e8eaed);
  overflow: hidden;
}

.cards-header {
  background: var(--header-bg, #e8eaed);
  border-bottom: none;
  padding: 0.5rem 1rem;
}

.header-content {
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--card-bg, #ffffff);
  color: var(--text-primary, #111827);
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  svg {
    width: 22px;
    height: 22px;
  }

  &:hover {
    background: var(--card-bg, #ffffff);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.search-container {
  flex: 1;
  max-width: 600px;
}

.search-input {
  width: 100%;
  background: var(--card-bg, #ffffff);
  border: none;
  border-radius: 12px;
  padding: 0.875rem 1.25rem;
  text-align: center;
  color: var(--text-primary, #111827);
  font-size: 0.9375rem;
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &::placeholder {
    color: var(--text-secondary, #6b7280);
  }

  &:focus {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.cards-main {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 0.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary, #757575);

  svg {
    margin-bottom: 1.5rem;
    opacity: 0.3;
  }

  .empty-text {
    font-size: 1.25rem;
    font-weight: 500;
    margin: 0 0 0.5rem 0;
  }

  .empty-hint {
    font-size: 0.9rem;
    opacity: 0.7;
    margin: 0;
  }
}

.cards-masonry {
  width: 100%;
  margin: 0 auto;
  position: relative;
  min-height: 200px;
}

// 时间轴布局
.cards-timeline {
  max-width: 900px;
  margin: 0 auto;
  margin-left: -0.5rem; // 抵消 cards-main 的左侧 padding
  padding: 0 0.25rem;
  display: flex;
  flex-direction: column-reverse; // 从下至上排列（旧到新）
}

.timeline-group {
  position: relative;
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;

  &:not(:last-child) {
    padding-bottom: 0;
  }

  &::before {
    content: '';
    position: absolute;
    left: 6.25rem;
    top: 0;
    bottom: -2rem;
    width: 2px;
    background: var(--timeline-line, #d1d5db);
  }

  &:first-child:not(:last-child)::before {
    display: none;
  }

  &.is-collapsed {
    margin-bottom: 1rem;

    &::before {
      bottom: -1rem;
    }
  }
}

.timeline-date {
  flex-shrink: 0;
  width: 6.5rem;
  padding-top: 0.25rem;
  padding-left: 0;
  text-align: center;
  position: relative;
  user-select: none;
  transition: all 0.2s;

  &.is-clickable {
    cursor: pointer;

    &:hover {
      .timeline-date-badge {
        transform: scale(1.05);
      }
    }

    &:hover::after {
      transform: scale(1.2);
    }
  }

  &::after {
    content: '';
    position: absolute;
    right: -0.25rem;
    top: 1.2rem;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--primary-color, #3b82f6);
    border: 3px solid var(--bg-color, #e8eaed);
    box-shadow: 0 0 0 2px var(--primary-color, #3b82f6);
    z-index: 2;
    transition: all 0.2s;
  }
}

.timeline-date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  transition: transform 0.2s;
}

.timeline-date-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-color, #3b82f6);
  line-height: 1.2;
  white-space: nowrap;
}

.timeline-date-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  line-height: 1.2;
  white-space: nowrap;
}

.timeline-date-weekday {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  line-height: 1.2;
  white-space: nowrap;
}

.timeline-post-count {
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--text-secondary, #9ca3af);
  line-height: 1.2;
  margin-top: 0.125rem;
}

.timeline-toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.125rem;
  color: var(--text-secondary, #6b7280);
}

.timeline-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 0;
  margin-left: -0.8rem;
  overflow: hidden; // 防止内容溢出
  min-width: 0; // 允许 flex 子元素收缩
}

.timeline-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.timeline-item-time {
  flex-shrink: 0;
  width: 2.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  text-align: center;
}

.timeline-item-card {
  flex: 1;
  min-width: 0; // 允许卡片收缩以适应容器
  overflow: hidden; // 防止卡片内容溢出

  :deep(.post-card) {
    min-height: 100px;
    max-height: 300px;
  }
}

// 列表布局
.cards-list {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  // 列表模式下的卡片样式
  :deep(.post-card) {
    min-height: 100px;
    max-height: 140px;
    padding: 0.875rem 1rem;
  }

  :deep(.card-title) {
    font-size: 0.9375rem;
    margin-bottom: 0.375rem;
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }

  :deep(.card-preview) {
    font-size: 0.8125rem;
    line-height: 1.4;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  :deep(.card-footer) {
    padding-top: 0.375rem;
  }
}

.fab-button {
  position: fixed;
  bottom: 2.5rem;
  right: 1.5rem;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary-color, #3b82f6);
  color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  transition: all 0.2s;
  z-index: 100;

  svg {
    width: 32px;
    height: 32px;
  }

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
  }

  &:active {
    transform: scale(1.05);
  }
}

// 标签弹窗样式
.tags-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.tags-popup {
  background: var(--card-bg, #ffffff);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tags-popup-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
  }
}

.tags-popup-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: var(--hover-bg, rgba(0, 0, 0, 0.05));
    color: var(--text-primary, #111827);
  }
}

.tags-popup-content {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.tag-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 1rem 0.75rem;
  border: none;
  border-radius: 12px;
  background: var(--card-bg, #ffffff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    border-color: var(--tag-color);
  }

  &:active {
    transform: translateY(0);
  }
}

.tag-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--tag-color);
}

.tag-count {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  background: var(--hover-bg, rgba(0, 0, 0, 0.05));
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .cards-view-container {
    --bg-color: #1a1a1a;
    --header-bg: #1a1a1a;
    --border-color: #3c3c3c;
    --border-hover: #4b5563;
    --text-primary: #f9fafb;
    --text-secondary: #9ca3ba;
    --card-bg: #2c2c2c;
    --hover-bg: #3c3c3c;
    --primary-color: #3b82f6;
    --timeline-line: #4b5563;
  }
}

// 响应式布局
@media (max-width: 1200px) {
  .cards-list {
    max-width: 700px;
    gap: 0.625rem;
  }
}

@media (max-width: 768px) {
  .cards-header {
    padding: 0.5rem 0.75rem;
  }

  .header-btn {
    width: 44px;
    height: 44px;

    svg {
      width: 20px;
      height: 20px;
    }
  }

  .search-input {
    font-size: 0.875rem;
    padding: 0.75rem 1rem;
  }

  .tags-popup {
    width: 95%;
    max-width: 420px;
  }

  .tags-popup-header {
    padding: 1rem 1.25rem;

    h3 {
      font-size: 1rem;
    }
  }

  .tags-popup-content {
    padding: 1rem 1.25rem;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.625rem;
  }

  .tag-item {
    padding: 0.875rem 0.625rem;
  }

  .tag-name {
    font-size: 0.875rem;
  }

  .tag-count {
    font-size: 0.6875rem;
  }

  .cards-main {
    padding: 0.875rem;
  }

  .cards-timeline {
    padding: 0 0.5rem;
  }

  .timeline-group {
    gap: 1rem;
    margin-bottom: 1.5rem;

    &::before {
      left: 5.5rem;
    }

    &.is-collapsed {
      margin-bottom: 0.75rem;

      &::before {
        bottom: -0.75rem;
      }
    }
  }

  .timeline-date {
    width: 5rem;

    &::after {
      right: 0.1875rem;
      top: 1.25rem;
      width: 10px;
      height: 10px;
    }
  }

  .timeline-date-label {
    font-size: 0.8125rem;
  }

  .timeline-date-text {
    font-size: 0.75rem;
  }

  .timeline-date-weekday {
    font-size: 0.625rem;
  }

  .timeline-post-count {
    font-size: 0.5625rem;
  }

  .timeline-toggle-icon {
    svg {
      width: 14px;
      height: 14px;
    }
  }

  .timeline-content {
    padding-left: 1rem;
    gap: 0.75rem;
  }

  .timeline-item {
    gap: 0.75rem;
  }

  .timeline-item-time {
    width: 2.5rem;
    font-size: 0.625rem;
  }

  .cards-list {
    max-width: 100%;
    padding: 0 0.5rem;
    gap: 0.5rem;
  }

  .fab-button {
    width: 56px;
    height: 56px;
    bottom: 2rem;
    right: 1.25rem;

    svg {
      width: 28px;
      height: 28px;
    }
  }
}

@media (max-width: 480px) {
  .cards-header {
    padding: 0.5rem;
  }

  .header-content {
    gap: 0.5rem;
  }

  .header-btn {
    width: 40px;
    height: 40px;

    svg {
      width: 18px;
      height: 18px;
    }
  }

  .search-input {
    font-size: 0.8125rem;
    padding: 0.625rem 1rem;
  }

  .tags-popup {
    width: 96%;
    max-width: 360px;
  }

  .tags-popup-header {
    padding: 0.875rem 1rem;

    h3 {
      font-size: 0.9375rem;
    }
  }

  .tags-popup-close {
    width: 28px;
    height: 28px;

    svg {
      width: 18px;
      height: 18px;
    }
  }

  .tags-popup-content {
    padding: 0.875rem 1rem;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
  }

  .tag-item {
    padding: 0.75rem 0.5rem;
  }

  .tag-name {
    font-size: 0.8125rem;
  }

  .tag-count {
    font-size: 0.625rem;
    padding: 0.0625rem 0.375rem;
  }

  .cards-main {
    padding: 0.325rem;
  }

  .cards-timeline {
    padding: 0 0.25rem;
  }

  .timeline-group {
    gap: 0.75rem;
    margin-bottom: 1.25rem;

    &::before {
      left: 4.5rem;
    }

    &.is-collapsed {
      margin-bottom: 0.5rem;

      &::before {
        bottom: -0.5rem;
      }
    }
  }

  .timeline-date {
    width: 4.5rem;

    &::after {
      right: -0.375rem;
      top: 1.125rem;
      width: 8px;
      height: 8px;
      border-width: 2px;
    }
  }

  .timeline-date-label {
    font-size: 0.75rem;
  }

  .timeline-date-text {
    font-size: 0.6875rem;
  }

  .timeline-date-weekday {
    font-size: 0.5625rem;
  }

  .timeline-post-count {
    font-size: 0.5rem;
  }

  .timeline-toggle-icon {
    svg {
      width: 12px;
      height: 12px;
    }
  }

  .timeline-content {
    padding-left: 0.75rem;
    gap: 0.5rem;
  }

  .timeline-item {
    gap: 0.5rem;
  }

  .timeline-item-time {
    width: 2rem;
    font-size: 0.5625rem;
  }

  .cards-list {
    padding: 0;
    gap: 0.5rem;
  }

  .fab-button {
    width: 52px;
    height: 52px;
    bottom: 1.5rem;
    right: 1rem;

    svg {
      width: 26px;
      height: 26px;
    }
  }
}

// 超小屏幕（窄屏手机）
@media (max-width: 360px) {
  .cards-main {
    padding: 0.5rem;
  }

  .search-input {
    font-size: 0.7rem;
  }
}
</style>
