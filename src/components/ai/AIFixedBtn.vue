<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDisplayStore } from '@/stores'
import AIAssistantPanel from './AIAssistantPanel.vue'

defineProps<{
  isMobile: boolean
  showEditor: boolean
}>()

const store = useStore()
const { editor } = storeToRefs(store)

const displayStore = useDisplayStore()
const { aiDialogVisible } = storeToRefs(displayStore)
const { toggleAIDialog } = displayStore

const aiAssistantPanelRef = ref<InstanceType<typeof AIAssistantPanel> | null>(null)

function handleAIFixedBtnClick() {
  // 每次点击都获取当前编辑器中选中的内容
  const selectedText = editor.value?.getSelection()?.trim() || ``

  // 打开AI助手面板
  toggleAIDialog(true)

  // 无论是否有选中内容，都更新引用内容（清空或设置新内容）
  nextTick(() => {
    if (aiAssistantPanelRef.value) {
      aiAssistantPanelRef.value.setQuotedContent(selectedText)
    }
  })
}
</script>

<template>
  <button
    v-if="!isMobile || (isMobile && showEditor)"
    class="z-[60] flex items-center justify-center rounded-full bg-blue-500 p-3 text-white shadow-lg transition active:scale-95 hover:scale-105 dark:bg-blue-600 hover:bg-blue-600 dark:text-white dark:ring-2 dark:ring-white/30 dark:hover:bg-blue-700"
    :class="[
      isMobile
        ? 'fixed top-[100px] right-4'
        : 'absolute top-[10px] right-6',
    ]"
    aria-label="AI 助手"
    @click="handleAIFixedBtnClick"
  >
    <span class="text-sm text-white font-semibold">AI</span>
  </button>
  <AIAssistantPanel ref="aiAssistantPanelRef" v-model:open="aiDialogVisible" />
</template>
