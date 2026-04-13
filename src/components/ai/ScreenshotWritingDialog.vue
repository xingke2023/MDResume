<script setup lang="ts">
import { ImagePlus, Send, X } from 'lucide-vue-next'
import { ref, toRaw } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { API_ENDPOINTS, API_KEY, getApiUrl } from '@/config/api'
import { useStore } from '@/stores'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  // eslint-disable-next-line quotes
  'update:visible': [value: boolean]
}>()

const store = useStore()

// 表单数据
const instruction = ref(``)
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const isProcessing = ref(false)

// 文件输入引用
const fileInput = ref<HTMLInputElement | null>(null)

function closeDialog() {
  emit(`update:visible`, false)
  // 重置表单
  instruction.value = ``
  imageFiles.value = []
  imagePreviews.value = []
}

// 选择图片
function selectImage() {
  fileInput.value?.click()
}

// 处理图片选择（支持多选）
function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) {
    return
  }

  // 检查图片数量限制
  const remainingSlots = 6 - imageFiles.value.length
  if (remainingSlots <= 0) {
    toast.error(`最多只能上传 6 张图片`)
    input.value = ``
    return
  }

  // 验证并添加每个文件
  let addedCount = 0
  Array.from(files).forEach((file) => {
    // 检查是否超过限制
    if (addedCount >= remainingSlots) {
      return
    }

    // 验证文件类型
    if (!file.type.startsWith(`image/`)) {
      toast.error(`${file.name} 不是图片文件`)
      return
    }

    // 验证文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} 大小超过10MB`)
      return
    }

    // 添加文件
    imageFiles.value.push(file)
    addedCount++

    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreviews.value.push(e.target?.result as string)
    }
    reader.onerror = () => {
      toast.error(`读取 ${file.name} 失败`)
    }
    reader.readAsDataURL(file)
  })

  // 如果有文件因数量限制未添加，提示用户
  if (files.length > remainingSlots) {
    toast.warning(`已添加 ${addedCount} 张图片，最多只能上传 6 张`)
  }

  // 清空input，允许重复选择同一文件
  input.value = ``
}

// 移除指定索引的图片
function removeImage(index: number) {
  imageFiles.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

// 压缩图片（针对OCR优化）
async function compressImage(file: File, index: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement(`canvas`)
        const ctx = canvas.getContext(`2d`)!

        // OCR最佳实践：宽度1920px足够识别文字，保持宽高比
        const maxWidth = 1920
        let width = img.width
        let height = img.height

        // 如果图片宽度大于maxWidth，按比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        // 使用高质量缩放算法
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = `high`
        ctx.drawImage(img, 0, 0, width, height)

        // 转为JPEG格式，质量0.85（对OCR文字识别影响很小，但能大幅减小文件大小）
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // 使用序号命名：image-1.jpg, image-2.jpg, ...
              const compressedFile = new File(
                [blob],
                `image-${index}.jpg`,
                { type: `image/jpeg` },
              )

              // 计算压缩比例
              const originalSizeKB = (file.size / 1024).toFixed(2)
              const compressedSizeKB = (compressedFile.size / 1024).toFixed(2)
              const ratio = ((1 - compressedFile.size / file.size) * 100).toFixed(1)

              console.log(`图片${index}压缩: ${file.name} → image-${index}.jpg`)
              console.log(`  原始大小: ${originalSizeKB} KB`)
              console.log(`  压缩后: ${compressedSizeKB} KB`)
              console.log(`  压缩率: ${ratio}%`)

              resolve(compressedFile)
            }
            else {
              reject(new Error(`图片压缩失败`))
            }
          },
          `image/jpeg`,
          0.85, // JPEG质量：0.85对文字识别足够，同时大幅减小文件
        )
      }
      img.onerror = () => reject(new Error(`图片加载失败`))
    }
    reader.onerror = () => reject(new Error(`图片读取失败`))
  })
}

// 发送请求
async function handleSubmit() {
  if (imageFiles.value.length === 0) {
    toast.error(`请至少上传一张图片`)
    return
  }

  if (!instruction.value.trim()) {
    toast.error(`请输入写作要求`)
    return
  }

  isProcessing.value = true

  try {
    // 压缩所有图片
    toast.loading(`正在压缩图片...`, { id: `compress-images` })
    const compressedFiles = await Promise.all(
      imageFiles.value.map((file, index) => compressImage(file, index + 1)),
    )
    toast.dismiss(`compress-images`)
    toast.success(`图片压缩完成，开始生成文稿...`)

    // 构建 FormData
    const formData = new FormData()
    formData.append(`instruction`, instruction.value.trim())

    // 添加压缩后的图片到 FormData
    compressedFiles.forEach((file) => {
      formData.append(`images`, file)
    })

    // 构建请求
    const apiUrl = getApiUrl(API_ENDPOINTS.IMAGE_GENERATE_ARTICLE)

    const headers: Record<string, string> = {
      'X-API-Key': API_KEY,
      // 不设置 Content-Type，让浏览器自动设置 multipart/form-data 的 boundary
    }

    const response = await fetch(apiUrl, {
      method: `POST`,
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`AI接口错误详情:`, errorText)
      throw new Error(`AI 接口请求失败 (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || `截图写作处理失败`)
    }

    const article = data.data?.article || data.article

    if (!article) {
      console.error(`AI响应数据:`, data)
      throw new Error(`未返回文稿内容`)
    }

    // 显示成功并插入文稿
    toast.success(`截图写作完成！文稿已插入编辑器`)
    console.log(`生成的文稿:`, article)

    // 将文稿插入到编辑器
    await insertArticleToEditor(article)

    // 关闭对话框
    closeDialog()
  }
  catch (error) {
    console.error(`截图写作处理失败:`, error)

    let errorMessage = `处理失败`
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes(`Failed to fetch`) || errorMsg.includes(`CORS`) || errorMsg.includes(`cross-origin`)) {
      errorMessage = `CORS跨域错误：请确保AI接口支持跨域访问，或使用代理服务`
    }
    else if (errorMsg.includes(`401`)) {
      errorMessage = `API密钥验证失败，请检查密钥配置`
    }
    else if (errorMsg.includes(`429`)) {
      errorMessage = `API调用频率超限，请稍后重试`
    }
    else if (errorMsg.includes(`403`)) {
      errorMessage = `API访问被拒绝，请检查密钥权限`
    }
    else if (errorMsg.includes(`404`)) {
      errorMessage = `API接口地址错误，请检查endpoint配置`
    }
    else {
      errorMessage = `处理失败: ${errorMsg}`
    }

    toast.error(errorMessage)
  }
  finally {
    isProcessing.value = false
  }
}

// 插入文稿到编辑器
async function insertArticleToEditor(article: string) {
  if (!store.editor) {
    console.warn(`编辑器未初始化`)
    toast.error(`编辑器未初始化`)
    return
  }

  try {
    // 获取当前光标位置
    const cursor = store.editor.getCursor()

    // 使用 toRaw 获取原始编辑器实例并插入（完全模仿本地上传方式）
    toRaw(store.editor!).replaceSelection(`\n${article}\n`, cursor as any)

    toast.success(`文稿已插入编辑器`)
    console.log(`✅ 文稿已成功插入到编辑器`)
  }
  catch (error) {
    const errorMsg = (error as Error).message || `插入文稿失败`
    toast.error(errorMsg)
    console.error(`❌ 插入文稿到编辑器失败:`, error)
  }
}
</script>

<template>
  <!-- 截图写作对话框 -->
  <div
    v-if="visible"
    class="backdrop-blur-sm fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
    @click="closeDialog"
  >
    <div
      class="relative mx-4 max-w-2xl w-[90vw] scale-100 transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 关闭按钮 -->
      <button
        class="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        :disabled="isProcessing"
        @click="closeDialog"
      >
        <X class="h-5 w-5" />
      </button>

      <!-- 标题 -->
      <h3 class="mb-2 text-center text-xl text-gray-900 font-bold dark:text-gray-100">
        截图写作
      </h3>

      <!-- 描述 -->
      <p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        上传最多 6 张截图，图片将自动压缩以优化 OCR 识别
      </p>

      <!-- 表单内容 -->
      <div class="space-y-4">
        <!-- 写作要求输入 -->
        <div>
          <label class="mb-2 block text-sm text-gray-700 font-medium dark:text-gray-300">
            写作要求 <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <textarea
              v-model="instruction"
              rows="3"
              placeholder="请描述您的写作要求，例如：根据这些截图写一篇产品介绍文章..."
              class="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 pb-10 text-sm text-gray-900 transition-colors dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:placeholder:text-gray-500"
            />

            <!-- 附件上传按钮 -->
            <div class="absolute bottom-2 left-2 flex items-center gap-2">
              <button
                type="button"
                :disabled="imageFiles.length >= 6"
                class="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 transition-colors disabled:cursor-not-allowed hover:bg-gray-100 dark:text-gray-400 disabled:opacity-50 dark:hover:bg-gray-700"
                @click="selectImage"
              >
                <ImagePlus class="h-4 w-4" />
                <span>{{ imageFiles.length > 0 ? `${imageFiles.length}/6 张图片` : '添加图片' }}</span>
              </button>
            </div>
          </div>

          <!-- 图片预览列表 -->
          <div v-if="imagePreviews.length > 0" class="grid grid-cols-3 mt-3 gap-2 md:grid-cols-6 sm:grid-cols-4">
            <div
              v-for="(preview, index) in imagePreviews"
              :key="index"
              class="group relative aspect-square overflow-hidden border-2 border-gray-300 rounded-lg dark:border-gray-600"
            >
              <img
                :src="preview"
                :alt="`预览图片 ${index + 1}`"
                class="object-cover h-full w-full"
              >
              <button
                class="absolute right-0.5 top-0.5 rounded-full bg-red-500 p-0.5 text-white opacity-0 shadow-lg transition-opacity hover:bg-red-600 group-hover:opacity-100"
                @click="removeImage(index)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
              <!-- 图片序号 -->
              <div class="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white font-medium">
                {{ index + 1 }}
              </div>
            </div>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <p class="text-sm text-blue-800 dark:text-blue-300">
            <span class="font-medium">💡 提示：</span>图片将自动压缩为 1920px 宽度的 JPEG 格式（质量 85%），足够 OCR 文字识别且大幅节省上传时间
          </p>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          class="flex-1"
          :disabled="isProcessing"
          @click="closeDialog"
        >
          取消
        </Button>
        <Button
          class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 flex-1 border-0 text-white"
          :disabled="isProcessing || !instruction.trim() || imageFiles.length === 0"
          @click="handleSubmit"
        >
          <Send v-if="!isProcessing" class="mr-1 h-4 w-4" />
          <div v-if="isProcessing" class="animate-spin mr-1 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          {{ isProcessing ? '生成中...' : '生成文稿' }}
        </Button>
      </div>
    </div>
  </div>

  <!-- 隐藏的文件选择输入框（支持多选） -->
  <input
    ref="fileInput"
    type="file"
    accept="image/*"
    multiple
    class="hidden"
    @change="handleImageChange"
  >
</template>
