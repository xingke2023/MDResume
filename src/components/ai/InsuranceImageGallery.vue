<script setup lang="ts">
import { ImageIcon, Loader2, Search } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { API_ENDPOINTS, API_KEY, EXTERNAL_APIS, getApiUrl, UNSPLASH_CONFIG } from '@/config/api'
import { useStore } from '@/stores'

/* ---------- 数据类型定义 ---------- */
interface LocalImage {
  id: number
  url: string
  basename: string
  original_url: string | null
  file_size: number
  content_type: string
  created_at: string
}

interface UnsplashImage {
  id: string
  created_at: string
  width: number
  height: number
  description: string | null
  alt_description: string | null
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  user: {
    name: string
    username: string
  }
}

type GalleryImage = LocalImage | UnsplashImage

/* ---------- 组件事件 ---------- */
const emit = defineEmits<{
  close: []
}>()

/* ---------- Store ---------- */
const store = useStore()
const editor = computed(() => store.editor)

/* ---------- 状态管理 ---------- */
const imageSource = ref<`local` | `unsplash`>(`unsplash`)
const galleryImages = ref<GalleryImage[]>([])
const selectedCategory = ref(`all`)
const isLoading = ref(false)
const hasMore = ref(true)
const offset = ref(0)
const page = ref(1)
const limit = 20

/* ---------- 搜索状态 ---------- */
const searchQuery = ref(`insurance`)
const searchDebounceTimer = ref<number | null>(null)

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

/* ---------- 类型守卫 ---------- */
function isLocalImage(image: GalleryImage): image is LocalImage {
  return `basename` in image
}

function isUnsplashImage(image: GalleryImage): image is UnsplashImage {
  return `urls` in image
}

/* ---------- 获取图片 URL ---------- */
function getImageUrl(image: GalleryImage): string {
  if (isLocalImage(image)) {
    return image.url
  }
  return image.urls.regular
}

function getImageThumbUrl(image: GalleryImage): string {
  if (isLocalImage(image)) {
    return image.url
  }
  return image.urls.thumb
}

/* ---------- 本地图库 API 调用 ---------- */
async function fetchLocalImages(reset = false) {
  if (isLoading.value || (!hasMore.value && !reset))
    return

  try {
    isLoading.value = true

    if (reset) {
      galleryImages.value = []
      offset.value = 0
      hasMore.value = true
    }

    const currentCategory = categories.value.find(c => c.id === selectedCategory.value)
    const basename = currentCategory?.basename || ``

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.value.toString(),
    })

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

    if (!result.success) {
      throw new Error(result.message || `获取图片失败`)
    }

    const newImages: LocalImage[] = result.data?.images || []
    const totalCount = result.data?.count || 0

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

/* ---------- Unsplash API 调用 ---------- */
async function fetchUnsplashImages(reset = false) {
  if (isLoading.value || (!hasMore.value && !reset))
    return

  try {
    isLoading.value = true

    if (reset) {
      galleryImages.value = []
      page.value = 1
      hasMore.value = true
    }

    // 如果有搜索词，使用搜索 API，否则使用默认关键词 insurance
    const query = searchQuery.value.trim() || `insurance`
    const url = `${EXTERNAL_APIS.UNSPLASH}/search/photos?query=${encodeURIComponent(query)}&page=${page.value}&per_page=${limit}`

    const response = await fetch(url, {
      method: `GET`,
      headers: {
        Authorization: `Client-ID ${UNSPLASH_CONFIG.ACCESS_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Unsplash images: ${response.statusText}`)
    }

    const result = await response.json()
    const newImages: UnsplashImage[] = result.results || []

    if (newImages.length < limit || page.value >= result.total_pages) {
      hasMore.value = false
    }

    galleryImages.value.push(...newImages)
    page.value += 1
  }
  catch (error) {
    console.error(`获取 Unsplash 图片失败:`, error)
    toast.error(`获取 Unsplash 图片失败`)
    hasMore.value = false
  }
  finally {
    isLoading.value = false
  }
}

/* ---------- 统一 fetch 接口 ---------- */
function fetchImages(reset = false) {
  if (imageSource.value === `local`) {
    return fetchLocalImages(reset)
  }
  return fetchUnsplashImages(reset)
}

/* ---------- 滚动加载 ---------- */
function handleScroll(event: Event) {
  const container = event.target as HTMLElement
  const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight

  if (scrollBottom < 200 && !isLoading.value && hasMore.value) {
    fetchImages()
  }
}

/* ---------- 源切换 ---------- */
function handleSourceChange(source: `local` | `unsplash`) {
  imageSource.value = source
  // 如果切换到 unsplash，重置分类
  if (source === `unsplash`) {
    selectedCategory.value = `all`
  }
  fetchImages(true)
}

/* ---------- 分类切换 ---------- */
function handleCategoryChange(categoryId: string) {
  selectedCategory.value = categoryId
  fetchImages(true)
}

/* ---------- 搜索处理 ---------- */
function handleSearch() {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }

  searchDebounceTimer.value = window.setTimeout(() => {
    if (imageSource.value === `unsplash`) {
      fetchImages(true)
    }
  }, 500)
}

/* ---------- 预览图片 ---------- */
function previewImage(image: GalleryImage) {
  selectedImage.value = image
  previewVisible.value = true
}

/* ---------- 图片插入 ---------- */
async function insertImage(imageUrl?: string) {
  const urlToInsert = imageUrl || (selectedImage.value ? getImageUrl(selectedImage.value) : null)
  if (!urlToInsert) {
    toast.error(`请选择要插入的图片`)
    return
  }
  if (!editor.value) {
    toast.error(`编辑器未初始化`)
    return
  }

  try {
    toast.loading(`正在插入图片...`, { id: `insert-gallery-image` })

    const cursor = editor.value.getCursor()
    const line = cursor.line

    const imageMarkdown = `![](${urlToInsert})\n`
    editor.value.replaceRange(imageMarkdown, { line, ch: 0 })

    editor.value.setCursor({ line: line + 1, ch: 0 })
    editor.value.focus()

    toast.success(`图片已插入`, { id: `insert-gallery-image` })

    previewVisible.value = false
    emit(`close`)

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
    <!-- 图片源选择 -->
    <div class="flex flex-shrink-0 gap-2 border-b p-4">
      <Button
        variant="outline"
        size="sm"
        :class="[
          imageSource === 'local'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background',
        ]"
        @click="handleSourceChange('local')"
      >
        本地图库
      </Button>
      <Button
        variant="outline"
        size="sm"
        :class="[
          imageSource === 'unsplash'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background',
        ]"
        @click="handleSourceChange('unsplash')"
      >
        Unsplash
      </Button>
    </div>

    <!-- 本地图库分类筛选 -->
    <div v-if="imageSource === 'local'" class="flex flex-shrink-0 flex-wrap gap-2 border-b p-4">
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

    <!-- Unsplash 搜索框 -->
    <div v-if="imageSource === 'unsplash'" class="flex flex-shrink-0 gap-2 border-b p-4">
      <div class="relative flex-1">
        <Search class="text-muted-foreground absolute left-3 top-2.5 h-4 w-4" />
        <Input
          v-model="searchQuery"
          placeholder="搜索图片..."
          class="pl-9"
          @input="handleSearch"
        />
      </div>
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
          :key="isLocalImage(image) ? image.id : image.id"
          class="group relative aspect-square cursor-pointer overflow-hidden border rounded-lg transition-all hover:shadow-lg"
          @click="previewImage(image)"
        >
          <img
            :src="getImageThumbUrl(image)"
            :alt="isLocalImage(image) ? `${image.basename} 图片` : (image.alt_description || image.description || 'Unsplash image')"
            class="object-cover h-full w-full transition-transform group-hover:scale-105"
            loading="lazy"
          >
          <!-- 悬浮遮罩 -->
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
            <div class="rounded-md bg-white/90 px-3 py-1 text-sm text-gray-900 font-medium">
              点击查看
            </div>
          </div>
          <!-- Unsplash 作者标注 -->
          <div v-if="isUnsplashImage(image)" class="from-black/60 to-transparent bg-gradient-to-t pointer-events-none absolute bottom-0 left-0 right-0 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
            <p class="truncate text-xs text-white">
              by {{ image.user.name }}
            </p>
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
              :src="getImageUrl(selectedImage)"
              :alt="isLocalImage(selectedImage) ? `${selectedImage.basename} 图片` : (selectedImage.alt_description || 'Image')"
              class="max-h-[60vh] w-auto rounded-lg"
            >
          </div>

          <!-- 图片信息 -->
          <div class="space-y-2 border-t pt-4 text-sm">
            <!-- 本地图片信息 -->
            <template v-if="isLocalImage(selectedImage)">
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
            </template>
            <!-- Unsplash 图片信息 -->
            <template v-else-if="isUnsplashImage(selectedImage)">
              <div class="flex justify-between">
                <span class="text-muted-foreground">作者：</span>
                <span>{{ selectedImage.user.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">尺寸：</span>
                <span>{{ selectedImage.width }} × {{ selectedImage.height }}</span>
              </div>
              <div v-if="selectedImage.description" class="flex flex-col gap-1">
                <span class="text-muted-foreground">描述：</span>
                <span class="text-sm">{{ selectedImage.description }}</span>
              </div>
            </template>
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
