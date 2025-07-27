<script setup lang="ts">
defineProps<{
  position: {
    top: number
    left: number
  }
}>()

const emit = defineEmits([`click`, `close`])

const visible = ref(false)

function show() {
  visible.value = true
}

function close() {
  visible.value = false
}

defineExpose({
  visible,
  show,
  close,
})
</script>

<template>
  <Transition name="fade-scale">
    <button
      v-show="visible"
      aria-label="AI 工具箱"
      class="absolute z-50 flex cursor-pointer items-center justify-center rounded-full bg-blue-500 px-3 py-2 text-white shadow-lg transition active:scale-95 hover:scale-105 dark:bg-blue-600 hover:bg-blue-600 dark:text-white dark:ring-2 dark:ring-white/30 dark:hover:bg-blue-700"
      :style="{
        left: `${position.left}px`,
        top: `${position.top}px`,
      }"
      @click="emit('click')"
    >
      <span class="text-xs font-semibold">AI</span>
    </button>
  </Transition>
</template>

<style scoped>
.fade-scale-enter-active {
  transition: all 0.2s ease-out;
}

.fade-scale-leave-active {
  transition: all 0.15s ease-in;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
