<script setup lang="ts">
import { Sparkles, XCircle } from 'lucide-vue-next'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'

defineProps<{
  confirmVisible: boolean
  loadingVisible: boolean
}>()

const emit = defineEmits<{
  // eslint-disable-next-line quotes
  'update:confirmVisible': [value: boolean]
  // eslint-disable-next-line quotes
  'update:loadingVisible': [value: boolean]
  // eslint-disable-next-line quotes
  'confirm': [mode: string, customRequirement: string]
  // eslint-disable-next-line quotes
  'stop': []
}>()

// 自定义要求
const customRequirement = ref(``)

function closeConfirm() {
  emit(`update:confirmVisible`, false)
  // 关闭时清空自定义要求
  customRequirement.value = ``
}

function closeLoading() {
  emit(`update:loadingVisible`, false)
}

function handleConfirm() {
  emit(`confirm`, `simple`, customRequirement.value)
}
</script>

<template>
  <!-- 一键排版确认对话框 -->
  <div
    v-if="confirmVisible"
    class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30"
    @click="closeConfirm"
  >
    <div
      class="mx-4 max-w-lg w-[90vw] scale-100 transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 标题图标 -->
      <div class="mb-4 flex items-center justify-center">
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-12 w-12 flex items-center justify-center rounded-full">
          <Sparkles class="h-6 w-6 text-white" />
        </div>
      </div>

      <!-- 标题 -->
      <h3 class="mb-4 text-center text-xl text-gray-900 font-bold dark:text-gray-100">
        全文一键排版
      </h3>

      <!-- 自定义要求输入 -->
      <div class="mb-4">
        <label class="mb-2 block text-sm text-gray-700 font-medium dark:text-gray-300">
          自定义排版要求（可选）
        </label>
        <textarea
          v-model="customRequirement"
          rows="2"
          placeholder="例如：标题使用蓝色、段落间距加大、重点内容加粗等..."
          class="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 transition-colors dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:placeholder:text-gray-500"
        />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          💡 不填写则按默认规则排版
        </p>
      </div>

      <!-- 提示内容 -->
      <div class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>⚠️ 此操作将替换当前内容，自动优化标题层级和段落结构，如不满意可使用 Ctrl+Z 撤销</p>
      </div>

      <!-- 按钮组 -->
      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          class="flex-1"
          @click="closeConfirm"
        >
          取消
        </Button>
        <Button
          class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex-1 border-0 text-white"
          @click="handleConfirm"
        >
          <Sparkles class="mr-1 h-4 w-4" />
          开始一键排版
        </Button>
      </div>
    </div>
  </div>

  <!-- 一键排版加载对话框 -->
  <div
    v-if="loadingVisible"
    class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30"
    @click="closeLoading"
  >
    <div
      class="mx-4 max-w-md w-[90vw] scale-100 transform rounded-2xl bg-white p-8 shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 动画图标 -->
      <div class="mb-6 flex justify-center">
        <div class="relative">
          <div class="h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Sparkles class="animate-pulse h-8 w-8 text-blue-500" />
          </div>
          <!-- 旋转光环 -->
          <div class="animate-spin absolute inset-0 h-16 w-16 border-2 border-blue-200 border-t-blue-500 rounded-full dark:border-blue-700" />
        </div>
      </div>

      <!-- 标题 -->
      <h3 class="mb-3 text-center text-xl text-gray-800 font-semibold dark:text-gray-200">
        AI 正在排版中
      </h3>

      <!-- 描述 -->
      <p class="mb-6 text-center text-gray-600 leading-relaxed dark:text-gray-400">
        正在使用人工智能分析您的内容<br>
        智能设置标题层级和格式<br>
        请耐心等待片刻...
      </p>

      <!-- 进度提示 -->
      <div class="space-y-3">
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div class="animate-pulse mr-3 h-2 w-2 rounded-full bg-blue-500" />
          分析文档结构和内容
        </div>
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div class="animate-pulse mr-3 h-2 w-2 rounded-full bg-blue-400" style="animation-delay: 0.2s" />
          智能分段和设置标题
        </div>
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div class="animate-pulse mr-3 h-2 w-2 rounded-full bg-blue-300" style="animation-delay: 0.4s" />
          优化Markdown格式
        </div>
      </div>

      <!-- 底部提示和停止按钮 -->
      <div class="space-y-3 mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
        <p class="text-center text-xs text-gray-500 dark:text-gray-400">
          💡 美化完成后内容将自动替换到编辑器中
        </p>
        <!-- 停止按钮 -->
        <div class="flex justify-center">
          <Button
            variant="outline"
            class="border-red-200 text-red-600 dark:border-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            @click="emit('stop')"
          >
            <XCircle class="mr-2 h-4 w-4" />
            停止排版
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
