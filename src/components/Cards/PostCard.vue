<script setup lang="ts">
import { computed } from 'vue'

interface Post {
  id: string
  title: string
  content: string
  createDatetime: Date
  updateDatetime: Date
  parentId?: string | null
}

const props = defineProps<{
  post: Post
}>()

const emit = defineEmits<{
  'card-click': [postId: string]
}>()

// 处理点击动画
const handleClick = (e: MouseEvent) => {
  const card = e.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()

  // 计算卡片中心点相对于视口中心的位置
  const cardCenterX = rect.left + rect.width / 2
  const cardCenterY = rect.top + rect.height / 2
  const viewportCenterX = window.innerWidth / 2
  const viewportCenterY = window.innerHeight / 2

  // 计算移动距离
  const deltaX = viewportCenterX - cardCenterX
  const deltaY = viewportCenterY - cardCenterY

  // 设置 CSS 变量
  card.style.setProperty('--fly-x', `${deltaX}px`)
  card.style.setProperty('--fly-y', `${deltaY}px`)

  // 添加动画类
  card.classList.add('flying')

  // 延迟触发真正的点击事件 - 更快
  setTimeout(() => {
    emit('card-click', props.post.id)
  }, 250)

  // 动画结束后移除类 - 更快
  setTimeout(() => {
    card.classList.remove('flying')
  }, 450)
}

// 获取卡片预览内容（去除Markdown语法）
const previewContent = computed(() => {
  // 移除 Markdown 标记
  let text = props.post.content
    .replace(/^#+\s+/gm, '') // 移除标题标记
    .replace(/\*\*(.+?)\*\*/g, '$1') // 移除加粗
    .replace(/\*(.+?)\*/g, '$1') // 移除斜体
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接
    .replace(/`(.+?)`/g, '$1') // 移除行内代码
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .trim()

  // 限制长度 - 增加到 300 字符让卡片高度更有变化
  return text.length > 300 ? text.slice(0, 300) + '...' : text
})

// 格式化日期
function formatDate(date: Date) {
  const d = new Date(date)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${month}月${day}日 ${hours}:${minutes}`
}

// 卡片背景色 - Keep风格使用纯白
const cardColor = computed(() => {
  return 'var(--card-bg, #FFFFFF)'
})
</script>

<template>
  <div class="post-card" @click="handleClick" :style="{ backgroundColor: cardColor }">
    <!-- 标题 -->
    <h3 class="card-title">{{ post.title }}</h3>

    <!-- 内容预览 -->
    <div class="card-body">
      <p class="card-preview">{{ previewContent }}</p>
    </div>

    <!-- 底部信息 -->
    <div class="card-footer">
      <div class="card-date">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{{ formatDate(post.updateDatetime) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.post-card {
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--border-color, #B8BCC4);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  min-height: 120px;
  max-height: 400px;
  position: relative;
  padding: 1rem 1rem 0.375rem 1rem;
  background: var(--card-bg, #FFFFFF);
  break-inside: avoid;
  page-break-inside: avoid;

  // 飞行动画变量
  --fly-x: 0px;
  --fly-y: 0px;

  &:hover {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  // 飞行动画状态
  &.flying {
    animation: flyToCenter 0.4s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
    z-index: 1000;
    will-change: transform, opacity;
  }
}

.card-title {
  color: var(--text-primary, #1F2937);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-body {
  flex: 1;
  overflow: hidden;
  margin-bottom: auto;
}

.card-preview {
  color: var(--text-secondary, #6B7280);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 10;
  -webkit-box-orient: vertical;
  white-space: pre-wrap;
}

.card-footer {
  padding: 0.25rem 0 0 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: auto;
}

.card-date {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--text-secondary, #9CA3AF);
  font-size: 0.75rem;
  margin: 0;
  padding: 0;

  svg {
    opacity: 0.6;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .post-card {
    --card-bg: #2C2C2C;
    --border-color: #5A5A5A;
    --text-primary: #E5E5E5;
    --text-secondary: #A0A0A0;
  }
}

// 手机端适配
@media (max-width: 768px) {
  .post-card {
    min-height: 100px;
    max-height: 350px;
    padding: 0.875rem 0.875rem 0.375rem 0.875rem;
  }

  .card-title {
    font-size: 0.9375rem;
    -webkit-line-clamp: 2;
    margin-bottom: 0.4rem;
  }

  .card-preview {
    font-size: 0.8125rem;
    line-height: 1.5;
    -webkit-line-clamp: 8;
  }

  .card-footer {
    padding: 0.2rem 0 0 0;

    .card-date {
      font-size: 0.7rem;

      svg {
        width: 10px;
        height: 10px;
      }
    }
  }
}

// 点击放大渐变动画 - 从小到大
@keyframes cardZoomIn {
  0% {
    transform: scale(0.85);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// 飞向中心的动画 - 使用 translate3d 硬件加速
@keyframes flyToCenter {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 1;
  }
  40% {
    transform: translate3d(calc(var(--fly-x) * 0.5), calc(var(--fly-y) * 0.5), 0) scale(1.2);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(var(--fly-x), var(--fly-y), 0) scale(1.6);
    opacity: 0;
  }
}
</style>
