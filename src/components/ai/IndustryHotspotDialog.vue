<script setup lang="ts">
import { Newspaper } from 'lucide-vue-next'
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
  <!-- 行业热点文案推送对话框 -->
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
        <div class="bg-gradient-to-r from-blue-500 to-cyan-600 h-12 w-12 flex items-center justify-center rounded-full">
          <Newspaper class="h-6 w-6 text-white" />
        </div>
      </div>

      <!-- 标题 -->
      <h3 class="mb-2 text-center text-xl text-gray-900 font-bold dark:text-gray-100">
        行业热点文案推送
      </h3>

      <!-- 描述 -->
      <p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        从官方媒体、权威媒介、大V获取行业热点爆文
      </p>

      <!-- 内容区域 -->
      <div class="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <span class="font-medium">📢 功能亮点：</span>
        </p>
        <ul class="space-y-2 mt-3 text-sm text-blue-700 dark:text-blue-300">
          <li>• <strong>多源汇聚</strong>：从官方媒体、权威媒介、大V获取最新行业热点爆文</li>
          <li>• <strong>精华提取</strong>：AI智能抓取文章核心要点和精华内容</li>
          <li>• <strong>写作规划</strong>：根据热点趋势定制个性化写作计划</li>
          <li>• <strong>日程建议</strong>：给出合理的写作计划和发布日程安排</li>
        </ul>
      </div>

      <!-- 提示信息 -->
      <div class="mb-6 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 p-3 dark:from-cyan-900/20 dark:to-blue-900/20">
        <p class="text-xs text-gray-700 leading-relaxed dark:text-gray-300">
          💡 <strong>使用建议：</strong>定期查看热点推送，把握行业风向，结合自身定位规划内容日历，让您的创作始终紧跟热点、富有时效性。
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
          class="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 flex-1 border-0 text-white"
          disabled
          @click="closeDialog"
        >
          <Newspaper class="mr-1 h-4 w-4" />
          敬请期待
        </Button>
      </div>
    </div>
  </div>
</template>
