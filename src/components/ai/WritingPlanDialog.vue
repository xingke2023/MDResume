<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

function closeDialog() {
  emit('update:visible', false)
}
</script>

<template>
  <!-- 个人写作计划建议对话框 -->
  <div
    v-if="visible"
    class="backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click="closeDialog"
  >
    <div
      class="mx-4 max-w-lg w-[90vw] scale-100 transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 标题图标 -->
      <div class="mb-4 flex items-center justify-center">
        <div class="bg-gradient-to-r from-purple-500 to-indigo-600 h-12 w-12 flex items-center justify-center rounded-full">
          <Calendar class="h-6 w-6 text-white" />
        </div>
      </div>

      <!-- 标题 -->
      <h3 class="mb-2 text-center text-xl text-gray-900 font-bold dark:text-gray-100">
        个人写作计划建议
      </h3>

      <!-- 描述 -->
      <p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        系统根据您所在行业热点智能帮您制定写作计划
      </p>

      <!-- 核心说明 -->
      <div class="mb-4 rounded-lg bg-gradient-to-r from-purple-100 to-indigo-100 border-2 border-purple-300 p-4 dark:from-purple-900/40 dark:to-indigo-900/40 dark:border-purple-700">
        <p class="text-sm text-purple-900 font-medium leading-relaxed dark:text-purple-100">
          ⭐ 系统会根据您所在行业的热点爆文，结合AI智能分析，为您量身定制一套完整的写作计划和发布日程。
        </p>
      </div>

      <!-- 内容区域 -->
      <div class="mb-6 rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
        <p class="text-sm text-purple-800 dark:text-purple-300">
          <span class="font-medium">📅 功能亮点：</span>
        </p>
        <ul class="space-y-2 mt-3 text-sm text-purple-700 dark:text-purple-300">
          <li>• <strong>行业爆文分析</strong>：实时追踪您所在行业的热点爆文和趋势</li>
          <li>• <strong>智能生成标题</strong>：根据行业热点爆文自动生成吸引眼球的文章标题</li>
          <li>• <strong>提纲自动梳理</strong>：为您的写作计划智能生成内容提纲和结构框架</li>
          <li>• <strong>图片资料推荐</strong>：提供与主题相关的图片资料和视觉素材建议</li>
          <li>• <strong>日程智能排期</strong>：为每个写作任务安排最佳发布时间</li>
        </ul>
      </div>

      <!-- 提示信息 -->
      <div class="mb-6 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 p-3 dark:from-purple-900/20 dark:to-indigo-900/20">
        <p class="text-xs text-gray-700 leading-relaxed dark:text-gray-300">
          💡 <strong>温馨提示：</strong>配合"行业热点文案推送"功能使用效果更佳，让您的创作始终紧跟行业脉搏，提升内容影响力。
        </p>
      </div>

      <!-- 按钮组 -->
      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          class="flex-1"
          @click="closeDialog"
        >
          关闭
        </Button>
        <Button
          class="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 flex-1 border-0 text-white"
          disabled
          @click="closeDialog"
        >
          <Calendar class="mr-1 h-4 w-4" />
          敬请期待
        </Button>
      </div>
    </div>
  </div>
</template>
