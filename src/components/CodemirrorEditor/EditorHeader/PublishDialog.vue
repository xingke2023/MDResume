<script setup lang="ts">
import { MessageCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import ImageCropper from './ImageCropper.vue'

const props = defineProps<{
  visible: boolean
  isPublishing: boolean
  publishForm: {
    title: string
    imageUrl: string
    author: string
    digest: string
    pic_crop_235_1: string
    pic_crop_1_1: string
  }
}>()

const emit = defineEmits([`update:visible`, `publish`, `selectImage`, `updateCrop`, `update:title`, `update:author`, `update:digest`])

function handleClose() {
  emit(`update:visible`, false)
}

function handlePublish() {
  emit(`publish`)
}

function handleSelectImage() {
  emit(`selectImage`)
}

function handleUpdateCrop(crop235: string, crop1: string) {
  emit(`updateCrop`, crop235, crop1)
}

/* eslint-disable vue/no-mutating-props */
function updateTitle(value: string) {
  // 直接修改是安全的，因为 publishForm 是父组件的 ref
  props.publishForm.title = value
}

function updateAuthor(value: string) {
  props.publishForm.author = value
}

function updateDigest(value: string) {
  props.publishForm.digest = value
}
/* eslint-enable vue/no-mutating-props */
</script>

<template>
  <!-- 发布到公众号对话框 -->
  <div
    v-if="props.visible"
    class="backdrop-blur-sm fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
    @click="handleClose"
  >
    <div
      class="my-8 max-w-2xl w-full scale-100 transform rounded-2xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 顶部固定标题区域 -->
      <div class="px-6 pt-6">
        <!-- 标题 -->
        <h3 class="mb-4 text-center text-xl text-gray-900 font-bold dark:text-gray-100">
          发布到公众号
        </h3>
      </div>

      <!-- 可滚动表单区域 -->
      <div class="max-h-[calc(90vh-240px)] overflow-y-auto px-6 py-4">
        <!-- 表单 -->
        <div class="space-y-4">
          <!-- 封面图片 -->
          <div>
            <label class="mb-2 block text-sm text-gray-700 font-medium dark:text-gray-300">
              封面图片
            </label>

            <!-- 图片裁剪组件 -->
            <ImageCropper
              :image-url="props.publishForm.imageUrl"
              @select-image="handleSelectImage"
              @update-crop="handleUpdateCrop"
            />
          </div>

          <!-- 标题 -->
          <div>
            <label class="mb-2 block text-sm text-gray-700 font-medium dark:text-gray-300">
              文章标题 <span class="text-red-500">*</span>
            </label>
            <input
              :value="props.publishForm.title"
              type="text"
              placeholder="请输入文章标题"
              class="dark:placeholder-gray-400 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 transition-colors dark:border-gray-600 focus:border-green-500 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              @input="updateTitle(($event.target as HTMLInputElement).value)"
            >
          </div>

          <!-- 作者 -->
          <div>
            <label class="mb-2 block text-sm text-gray-700 font-medium dark:text-gray-300">
              作者
            </label>
            <input
              :value="props.publishForm.author"
              type="text"
              placeholder="请输入作者名称"
              class="dark:placeholder-gray-400 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 transition-colors dark:border-gray-600 focus:border-green-500 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              @input="updateAuthor(($event.target as HTMLInputElement).value)"
            >
          </div>

          <!-- 摘要 -->
          <div>
            <label class="mb-2 block text-sm text-gray-700 font-medium dark:text-gray-300">
              文章摘要
            </label>
            <textarea
              :value="props.publishForm.digest"
              rows="3"
              placeholder="请输入文章摘要（选填）"
              class="dark:placeholder-gray-400 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 transition-colors dark:border-gray-600 focus:border-green-500 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              @input="updateDigest(($event.target as HTMLTextAreaElement).value)"
            />
          </div>

          <!-- 提示信息 -->
          <div class="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <p class="text-sm text-green-800 dark:text-green-300">
              <span class="font-medium">💡 提示：</span>系统已自动从文章中提取标题、封面和摘要，您可以根据需要修改
            </p>
          </div>
        </div>
      </div>

      <!-- 底部固定按钮区域 -->
      <div class="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
        <div class="flex justify-end gap-3">
          <Button
            variant="outline"
            class="flex-1"
            :disabled="props.isPublishing"
            @click="handleClose"
          >
            取消
          </Button>
          <Button
            class="from-green-500 to-blue-600 bg-gradient-to-r hover:from-green-600 hover:to-blue-700 flex-1 border-0 text-white"
            :disabled="props.isPublishing || !props.publishForm.title.trim()"
            @click="handlePublish"
          >
            <MessageCircle v-if="!props.isPublishing" class="mr-1 h-4 w-4" />
            <div v-if="props.isPublishing" class="animate-spin mr-1 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            {{ props.isPublishing ? '发布中...' : '确认发布' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
