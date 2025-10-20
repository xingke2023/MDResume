<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import { useStore } from '@/stores'

const store = useStore()
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page-slide" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
  <Toaster
    rich-colors
    position="top-center"
    :theme="store.isDark ? 'dark' : 'light'"
    close-button
  />
</template>

<style lang="less">
html,
body,
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}

// 抵消下拉菜单开启时带来的样式
body {
  pointer-events: initial !important;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
  background-color: #ffffff;
}

::-webkit-scrollbar-track {
  border-radius: 6px;
  background-color: rgba(200, 200, 200, 0.3);
}

::-webkit-scrollbar-thumb {
  border-radius: 6px;
  background-color: rgba(144, 146, 152, 0.5);
}

/* CSS-hints */
.CodeMirror-hints {
  position: absolute;
  z-index: 10;
  overflow-y: auto;
  margin: 0;
  padding: 2px;
  border-radius: 4px;
  max-height: 20em;
  min-width: 200px;
  font-size: 12px;
  font-family: monospace;

  color: #333333;
  background-color: #ffffff;
  box-shadow:
    0 4px 8px 0 rgba(0, 0, 0, 0.12),
    0 2px 4px 0 rgba(0, 0, 0, 0.08);
}

.CodeMirror-hint {
  margin-top: 10px;
  padding: 4px 6px;
  border-radius: 2px;
  white-space: pre;
  color: #000000;
  cursor: pointer;

  &:first-of-type {
    margin-top: 0;
  }
  &:hover {
    background: #f0f0f0;
  }
}
.search-match {
  background-color: #ffeb3b; /* 所有匹配项颜色 */
}
.current-match {
  background-color: #ff5722; /* 当前匹配项更鲜艳的颜色 */
}

/* 页面切换转场动画 - 已禁用 */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: none;
}

/* Toast 关闭按钮样式 */
:deep(.toast) {
  position: relative !important;
  padding-right: 2.5rem !important;
}

:deep(.custom-close-button) {
  position: absolute !important;
  right: 0.5rem !important;
  left: auto !important;
  top: 0.5rem !important;
  bottom: auto !important;
  transform: none !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 1.5rem !important;
  height: 1.5rem !important;
  opacity: 1 !important;
}

/* 手机端 Toast 关闭按钮垂直居中 */
@media (max-width: 768px) {
  :deep(.custom-close-button) {
    top: 50% !important;
    transform: translateY(-50%) !important;
  }
}
</style>
