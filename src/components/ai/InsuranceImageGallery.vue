<script setup lang="ts">
import { ImageIcon } from 'lucide-vue-next'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'

// 图库数据（后续可以从 API 获取）
// @ts-expect-error - Placeholder for future implementation
const _galleryImages = ref<{ id: string, url: string, title: string, category: string }[]>([
  // 示例数据，后续替换为真实数据
])

// 当前选中的分类
const selectedCategory = ref(`all`)

// 分类列表
const categories = ref([
  { id: `all`, name: `全部` },
  { id: `person`, name: `人物` },
  { id: `scene`, name: `场景` },
  { id: `product`, name: `产品` },
])

// 选择图片
// @ts-expect-error - Placeholder for future implementation
function _selectImage(imageUrl: string) {
  // TODO: 实现图片选择逻辑
  console.log(`Selected image:`, imageUrl)
}
</script>

<template>
  <div class="space-y-4 flex flex-1 flex-col overflow-y-auto">
    <!-- 分类筛选 -->
    <div class="flex flex-wrap gap-2">
      <Button
        v-for="category in categories"
        :key="category.id"
        variant="outline"
        size="sm"
        :class="[
          selectedCategory === category.id
            ? 'bg-primary text-primary-foreground'
            : 'bg-background',
        ]"
        @click="selectedCategory = category.id"
      >
        {{ category.name }}
      </Button>
    </div>

    <!-- 功能说明 -->
    <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
      <div class="flex items-center gap-2">
        <ImageIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <p class="text-sm text-blue-800 font-medium dark:text-blue-300">
          保险人图库
        </p>
      </div>
      <p class="mt-2 text-sm text-blue-700 dark:text-blue-400">
        此功能正在开发中，敬请期待...
      </p>
    </div>

    <!-- 图片网格（占位） -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4 md:grid-cols-3">
      <!-- 示例占位卡片 -->
      <div
        v-for="i in 8"
        :key="i"
        class="aspect-square flex items-center justify-center border-2 border-gray-300 rounded-lg border-dashed dark:border-gray-600"
      >
        <div class="text-center">
          <ImageIcon class="mx-auto h-8 w-8 text-gray-400" />
          <p class="mt-2 text-xs text-gray-500">
            占位图片
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
