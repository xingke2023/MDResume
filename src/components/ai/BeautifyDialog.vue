<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps<{
  confirmVisible: boolean
  loadingVisible: boolean
}>()

const emit = defineEmits<{
  'update:confirmVisible': [value: boolean]
  'update:loadingVisible': [value: boolean]
  'confirm': [mode: string, customRequirement: string]
}>()

// 排版模式
const selectedMode = ref('simple')

// 自定义要求
const customRequirement = ref('')

const modes = [
  {
    value: 'simple',
    label: '简易模式',
    description: '基础排版，适合日常快速整理',
  },
  {
    value: 'standard',
    label: '标准模式',
    description: '完整排版，标题层级、段落优化',
  },
  {
    value: 'professional',
    label: '专业模式',
    description: '深度优化，适合正式发布内容',
  },
]

function closeConfirm() {
  emit('update:confirmVisible', false)
  // 关闭时清空自定义要求
  customRequirement.value = ''
}

function closeLoading() {
  emit('update:loadingVisible', false)
}

function handleConfirm() {
  emit('confirm', selectedMode.value, customRequirement.value)
}
</script>

<template>
  <!-- 一键排版确认对话框 -->
  <div
    v-if="confirmVisible"
    class="backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50"
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

      <!-- 模式选择 -->
      <div class="mb-6">
        <label class="mb-3 block text-sm text-gray-700 font-medium dark:text-gray-300">
          选择排版模式
        </label>
        <div class="space-y-3">
          <label
            v-for="mode in modes"
            :key="mode.value"
            class="flex items-start space-x-3 rounded-lg border border-gray-200 p-3 transition-colors cursor-pointer dark:border-gray-700"
            :class="[
              selectedMode === mode.value
                ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            ]"
          >
            <input
              v-model="selectedMode"
              type="radio"
              :value="mode.value"
              class="mt-1 h-4 w-4 cursor-pointer border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
            >
            <div class="flex-1">
              <div
                class="text-sm font-medium"
                :class="[
                  selectedMode === mode.value
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-900 dark:text-gray-100'
                ]"
              >
                {{ mode.label }}
              </div>
              <p
                class="text-xs"
                :class="[
                  selectedMode === mode.value
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                ]"
              >
                {{ mode.description }}
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- 自定义要求输入 -->
      <div class="mb-6">
        <label class="mb-2 block text-sm text-gray-700 font-medium dark:text-gray-300">
          自定义排版要求（可选）
        </label>
        <textarea
          v-model="customRequirement"
          rows="3"
          placeholder="例如：标题使用蓝色、段落间距加大、重点内容加粗等..."
          class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          💡 不填写则按照所选模式的默认规则进行排版
        </p>
      </div>

      <!-- 提示内容 -->
      <div class="space-y-2 mb-6 text-sm text-gray-600 leading-relaxed dark:text-gray-300">
        <p class="text-center text-orange-600 font-medium dark:text-orange-400">
          ⚠️ 重要提醒：此操作将会完全替换当前编辑器内容
        </p>
        <div class="space-y-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
          <p>• <strong>使用场景：</strong>适合对纯文字流水账进行排版</p>
          <p>• <strong>格式美化：</strong>自动调整标题层级、段落结构</p>
          <p>• <strong>内容保持：</strong>保留原文核心含义，仅优化格式</p>
          <p>• <strong>一键撤销：</strong>如不满意结果，可使用 Ctrl+Z 快速恢复</p>
        </div>
        <p class="text-center text-xs text-gray-500 dark:text-gray-400">
          建议在重要内容编辑前先备份，或在空白文档中测试效果
        </p>
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
    class="backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50"
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
        AI 正在美化您的文档
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

      <!-- 底部提示 -->
      <div class="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
        <p class="text-center text-xs text-gray-500 dark:text-gray-400">
          💡 美化完成后内容将自动替换到编辑器中
        </p>
      </div>
    </div>
  </div>
</template>
