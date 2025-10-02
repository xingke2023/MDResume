<script setup lang="ts">
import { Image as ImageIcon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useDisplayStore } from '@/stores'
import AIAssistantPanel from './AIAssistantPanel.vue'
import AIImageGeneratorPanel from './AIImageGeneratorPanel.vue'

defineProps<{
  isMobile: boolean
  showEditor: boolean
}>()

const store = useStore()
const { editor } = storeToRefs(store)

const displayStore = useDisplayStore()
const { aiDialogVisible, aiImageDialogVisible } = storeToRefs(displayStore)
const { toggleAIDialog, toggleAIImageDialog } = displayStore

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
  <!-- AI 助手按钮 -->
  <button
    v-if="(!isMobile || (isMobile && showEditor)) && !(isMobile && store.isOpenPostSlider)"
    class="backdrop-blur-sm z-[60] h-12 w-12 flex items-center justify-center rounded-full bg-blue-500/60 text-white shadow-lg transition active:scale-95 hover:scale-105 dark:bg-blue-600/60 hover:bg-blue-500/80 dark:hover:bg-blue-600/80"
    :class="[
      isMobile
        ? 'fixed top-[100px] right-[1px]'
        : 'absolute top-[10px] right-[1px]',
    ]"
    aria-label="AI 助手"
    @click="handleAIFixedBtnClick"
  >
    <span class="text-sm text-white font-semibold">AI</span>
  </button>

  <!-- AI 文生图按钮 -->
  <button
    v-if="(!isMobile || (isMobile && showEditor)) && !(isMobile && store.isOpenPostSlider)"
    class="backdrop-blur-sm bg-primary/60 hover:bg-primary/80 z-[60] h-12 w-12 flex items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 hover:scale-105 dark:bg-gray-700/60 dark:hover:bg-gray-700/80"
    :class="[
      isMobile
        ? 'fixed top-[160px] right-[1px]'
        : 'absolute top-[70px] right-[1px]',
    ]"
    aria-label="AI 文生图"
    @click="() => toggleAIImageDialog(true)"
  >
    <ImageIcon class="h-5 w-5" />
  </button>

  <!-- 面板组件 -->
  <AIAssistantPanel ref="aiAssistantPanelRef" v-model:open="aiDialogVisible" />
  <AIImageGeneratorPanel v-model:open="aiImageDialogVisible" />
</template>
