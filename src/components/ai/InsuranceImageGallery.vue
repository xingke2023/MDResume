<script setup lang="ts">
import { ImageIcon, Loader2 } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { API_ENDPOINTS, API_KEY, getApiUrl } from '@/config/api'
import { useStore } from '@/stores'

/* ---------- 数据类型定义 ---------- */
interface GalleryImage {
  id: number
  url: string
  basename: string
  original_url: string | null
  file_size: number
  content_type: string
  created_at: string
}

/* ---------- 组件事件 ---------- */
const emit = defineEmits<{
  close: []
}>()

/* ---------- Store ---------- */
const store = useStore()
const editor = computed(() => store.editor)

/* ---------- 状态管理 ---------- */
const galleryImages = ref<GalleryImage[]>([])
const selectedCategory = ref(`all`)
const isLoading = ref(false)
const hasMore = ref(true)
const offset = ref(0)
const limit = 20

/* ---------- 预览状态 ---------- */
const previewVisible = ref(false)
const selectedImage = ref<GalleryImage | null>(null)

/* ---------- 分类列表 ---------- */
const categories = ref([
  { id: `all`, name: `全部`, basename: `` },
  { id: `person`, name: `人物`, basename: `person` },
  { id: `scene`, name: `场景`, basename: `scene` },
  { id: `product`, name: `产品`, basename: `product` },
  { id: `insurance`, name: `保险`, basename: `insurance` },
])

/* ---------- 容器引用 ---------- */
const containerRef = ref<HTMLElement | null>(null)

/* ---------- API 调用 ---------- */
async function fetchImages(reset = false) {
  if (isLoading.value || (!hasMore.value && !reset))
    return

  try {
    isLoading.value = true

    // 如果是重置，清空数据
    if (reset) {
      galleryImages.value = []
      offset.value = 0
      hasMore.value = true
    }

    // 构建查询参数
    const currentCategory = categories.value.find(c => c.id === selectedCategory.value)
    const basename = currentCategory?.basename || ``

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.value.toString(),
    })

    // 只在有 basename 时才添加
    if (basename) {
      params.append(`basename`, basename)
    }

    const url = `${getApiUrl(API_ENDPOINTS.IMAGE_LIST)}?${params.toString()}`

    const response = await fetch(url, {
      method: `GET`,
      headers: {
        'X-API-Key': API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.statusText}`)
    }

    const result = await response.json()

    // 检查返回状态
    if (!result.success) {
      throw new Error(result.message || `获取图片失败`)
    }

    // 解析数据
    const newImages: GalleryImage[] = result.data?.images || []
    const totalCount = result.data?.count || 0

    // 判断是否还有更多数据
    if (newImages.length < limit || galleryImages.value.length + newImages.length >= totalCount) {
      hasMore.value = false
    }

    galleryImages.value.push(...newImages)
    offset.value += limit
  }
  catch (error) {
    console.error(`获取图片列表失败:`, error)
    toast.error(`获取图片列表失败`)
    hasMore.value = false
  }
  finally {
    isLoading.value = false
  }
}

/* ---------- 滚动加载 ---------- */
function handleScroll(event: Event) {
  const container = event.target as HTMLElement
  const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight

  // 当滚动到距离底部 200px 时加载更多
  if (scrollBottom < 200 && !isLoading.value && hasMore.value) {
    fetchImages()
  }
}

/* ---------- 分类切换 ---------- */
function handleCategoryChange(categoryId: string) {
  selectedCategory.value = categoryId
  fetchImages(true)
}

/* ---------- 预览图片 ---------- */
function previewImage(image: GalleryImage) {
  selectedImage.value = image
  previewVisible.value = true
}

/* ---------- 图片插入 ---------- */
async function insertImage(imageUrl?: string) {
  // 如果没有传入 imageUrl，使用选中的图片
  const urlToInsert = imageUrl || selectedImage.value?.url
  if (!urlToInsert) {
    toast.error(`请选择要插入的图片`)
    return
  }
  if (!editor.value) {
    toast.error(`编辑器未初始化`)
    return
  }

  try {
    // 显示插入中提示
    toast.loading(`正在插入图片...`, { id: `insert-gallery-image` })

    // 获取光标位置
    const cursor = editor.value.getCursor()
    const line = cursor.line

    // 插入 Markdown 图片语法
    const imageMarkdown = `![](${urlToInsert})\n`
    editor.value.replaceRange(imageMarkdown, { line, ch: 0 })

    // 移动光标到新行
    editor.value.setCursor({ line: line + 1, ch: 0 })
    editor.value.focus()

    toast.success(`图片已插入`, { id: `insert-gallery-image` })

    // 关闭预览
    previewVisible.value = false

    // 关闭对话框
    emit(`close`)

    // 切换到预览模式（仅移动端）
    if (store.isMobile) {
      window.dispatchEvent(new CustomEvent(`switch-to-preview`))
    }
  }
  catch (error) {
    console.error(`插入图片失败:`, error)
    toast.error(`插入图片失败`, { id: `insert-gallery-image` })
  }
}

/* ---------- 生命周期 ---------- */
onMounted(() => {
  fetchImages()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 分类筛选 -->
    <div class="flex flex-shrink-0 flex-wrap gap-2 border-b p-4">
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
        @click="handleCategoryChange(category.id)"
      >
        {{ category.name }}
      </Button>
    </div>

    <!-- 图片网格 -->
    <div
      ref="containerRef"
      class="custom-scroll flex-1 overflow-y-auto p-4"
      @scroll="handleScroll"
    >
      <!-- 图片列表 -->
      <div v-if="galleryImages.length > 0" class="grid grid-cols-2 gap-3 lg:grid-cols-4 md:grid-cols-3">
        <div
          v-for="image in galleryImages"
          :key="image.id"
          class="group relative aspect-square cursor-pointer overflow-hidden border rounded-lg transition-all hover:shadow-lg"
          @click="previewImage(image)"
        >
          <img
            :src="image.url"
            :alt="`${image.basename} 图片`"
            class="object-cover h-full w-full transition-transform group-hover:scale-105"
            loading="lazy"
          >
          <!-- 悬浮遮罩 -->
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
            <div class="rounded-md bg-white/90 px-3 py-1 text-sm text-gray-900 font-medium">
              点击查看
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!isLoading" class="flex flex-col items-center justify-center py-12 text-center">
        <ImageIcon class="mb-4 h-16 w-16 text-gray-300" />
        <p class="text-muted-foreground text-sm">
          暂无图片
        </p>
      </div>

      <!-- 加载更多指示器 -->
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <Loader2 class="animate-spin text-primary h-6 w-6" />
        <span class="text-muted-foreground ml-2 text-sm">加载中...</span>
      </div>

      <!-- 没有更多提示 -->
      <div v-if="!hasMore && galleryImages.length > 0" class="text-muted-foreground py-4 text-center text-sm">
        没有更多图片了
      </div>
    </div>

    <!-- 图片预览 Dialog -->
    <Dialog v-model:open="previewVisible">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>图片预览</DialogTitle>
        </DialogHeader>
        <div v-if="selectedImage" class="space-y-4">
          <!-- 图片显示 -->
          <div class="flex items-center justify-center rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <img
              :src="selectedImage.url"
              :alt="`${selectedImage.basename} 图片`"
              class="max-h-[60vh] w-auto rounded-lg"
            >
          </div>

          <!-- 图片信息 -->
          <div class="space-y-2 border-t pt-4 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">分类：</span>
              <span>{{ selectedImage.basename }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">大小：</span>
              <span>{{ (selectedImage.file_size / 1024).toFixed(2) }} KB</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">类型：</span>
              <span>{{ selectedImage.content_type }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              @click="previewVisible = false"
            >
              取消
            </Button>
            <Button
              @click="insertImage()"
            >
              插入到编辑器
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}

@media (pointer: coarse) {
  /* 触屏设备更细 */
  .custom-scroll::-webkit-scrollbar {
    width: 3px;
  }
}

.custom-scroll::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background-color: rgba(156, 163, 175, 0.4);
}

.custom-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.6);
}

html.dark .custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(107, 114, 128, 0.4);
}

html.dark .custom-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.7);
}

.custom-scroll {
  scrollbar-width: thin;
}
</style>
