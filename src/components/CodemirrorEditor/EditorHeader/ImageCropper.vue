<script setup lang="ts">
import { ImagePlus } from 'lucide-vue-next'

const props = defineProps<{
  imageUrl: string
}>()

const emit = defineEmits<{
  selectImage: []
  updateCrop: [crop235: string, crop1: string]
}>()

// 图片裁剪相关状态
const selectedRatio = ref<`2.35:1` | `1:1`>(`2.35:1`)
const imageOffset = ref({ x: 0, y: 0 }) // 当前比例的图片偏移量(百分比)
const savedOffsets = ref({
  '2.35:1': { x: 0, y: 0 },
  '1:1': { x: 0, y: 0 },
}) // 保存每个比例的偏移量
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const imageContainer = ref<HTMLDivElement | null>(null)
const previewImageRef = ref<HTMLImageElement | null>(null)

// 切换裁剪比例
function switchCropRatio(ratio: `2.35:1` | `1:1`) {
  // 保存当前比例的偏移量
  savedOffsets.value[selectedRatio.value] = { ...imageOffset.value }

  // 切换到新比例
  selectedRatio.value = ratio

  // 恢复新比例的偏移量
  imageOffset.value = { ...savedOffsets.value[ratio] }

  updateCropParameters()
}

// 居中图片
function centerImage() {
  imageOffset.value = { x: 0, y: 0 }
}

// 开始拖动图片
function startDrag(event: MouseEvent | TouchEvent) {
  if (!imageContainer.value || !props.imageUrl)
    return

  isDragging.value = true

  const clientX = `touches` in event ? event.touches[0].clientX : event.clientX
  const clientY = `touches` in event ? event.touches[0].clientY : event.clientY

  dragStart.value = { x: clientX, y: clientY }

  // 阻止默认行为
  event.preventDefault()
}

// 拖动图片
function onDrag(event: MouseEvent | TouchEvent) {
  if (!isDragging.value || !imageContainer.value || !previewImageRef.value)
    return

  const clientX = `touches` in event ? event.touches[0].clientX : event.clientX
  const clientY = `touches` in event ? event.touches[0].clientY : event.clientY

  const containerRect = imageContainer.value.getBoundingClientRect()

  // 计算拖动距离(像素)
  const deltaXPx = clientX - dragStart.value.x
  const deltaYPx = clientY - dragStart.value.y

  // 获取图片实际尺寸比例
  const img = previewImageRef.value
  const imgAspect = img.naturalWidth / img.naturalHeight
  const containerAspect = selectedRatio.value === `2.35:1` ? 2.35 : 1

  // 计算图片尺寸(百分比)
  let imgWidthPct, imgHeightPct
  if (imgAspect > containerAspect) {
    // 图片比预览区域宽 → 高度100%,宽度超出
    imgHeightPct = 100
    imgWidthPct = (imgAspect / containerAspect) * 100
  }
  else {
    // 图片比预览区域高 → 宽度100%,高度超出
    imgWidthPct = 100
    imgHeightPct = (containerAspect / imgAspect) * 100
  }

  // 计算图片边界
  // 图片使用 translate(calc(-50% + offset), calc(-50% + offset)) 定位
  // 图片左边位置 = 50% - imgWidth/2 + offset = (50 - imgWidth/2 + offset)%
  // 图片右边位置 = 50% + imgWidth/2 + offset = (50 + imgWidth/2 + offset)%

  // 限制条件(图片边缘不能超出预览区 0%-100%):
  // 图片左边 >= 0: 50 - imgWidth/2 + offsetX >= 0 → offsetX >= imgWidth/2 - 50
  // 图片右边 <= 100: 50 + imgWidth/2 + offsetX <= 100 → offsetX <= 50 - imgWidth/2
  // 图片上边 >= 0: 50 - imgHeight/2 + offsetY >= 0 → offsetY >= imgHeight/2 - 50
  // 图片下边 <= 100: 50 + imgHeight/2 + offsetY <= 100 → offsetY <= 50 - imgHeight/2

  const minOffsetXPct = 50 - imgWidthPct / 2 // 向左拖到极限(图片右边到达预览区右边)
  const maxOffsetXPct = imgWidthPct / 2 - 50 // 向右拖到极限(图片左边到达预览区左边)
  const minOffsetYPct = 50 - imgHeightPct / 2 // 向上拖到极限(图片下边到达预览区下边)
  const maxOffsetYPct = imgHeightPct / 2 - 50 // 向下拖到极限(图片上边到达预览区上边)

  // 转换拖动距离为百分比
  const deltaXPct = (deltaXPx / containerRect.width) * 100
  const deltaYPct = (deltaYPx / containerRect.height) * 100

  // 更新偏移量,限制在有效范围内(图片边缘不能超出预览区)
  const newX = Math.max(minOffsetXPct, Math.min(maxOffsetXPct, imageOffset.value.x + deltaXPct))
  const newY = Math.max(minOffsetYPct, Math.min(maxOffsetYPct, imageOffset.value.y + deltaYPct))

  // 只有在实际位置改变时才更新dragStart
  // 如果到达边界,位置不变,dragStart也不变,避免累积误差
  if (newX !== imageOffset.value.x || newY !== imageOffset.value.y) {
    imageOffset.value = { x: newX, y: newY }
    dragStart.value = { x: clientX, y: clientY }

    // 同时更新保存的偏移量
    savedOffsets.value[selectedRatio.value] = { x: newX, y: newY }

    // 更新裁剪参数
    updateCropParameters()
  }

  event.preventDefault()
}

// 停止拖动
function stopDrag() {
  isDragging.value = false
}

// 保存两个比例的裁剪参数
const savedCrops = ref({
  '2.35:1': ``,
  '1:1': ``,
})

// 更新裁剪参数（生成 X1_Y1_X2_Y2 格式）
function updateCropParameters() {
  if (!previewImageRef.value || !imageContainer.value)
    return

  const img = previewImageRef.value
  const imgAspect = img.naturalWidth / img.naturalHeight
  const containerAspect = selectedRatio.value === `2.35:1` ? 2.35 : 1

  let x1, y1, x2, y2

  if (imgAspect > containerAspect) {
    // 图片比预览区域宽 → 高度占满,宽度超出,可以左右拖动
    // 预览区域看到的是原图的全部高度,部分宽度

    // 预览区域宽度占原图宽度的比例
    const visibleWidthRatio = containerAspect / imgAspect

    // imageOffset.x 是百分比,范围从 -maxOffset 到 +maxOffset
    // 转换为原图坐标系(0-1)中的偏移
    // 当offset=0时,预览区域居中
    // 当offset<0时,图片向左移动,看到右边部分
    // 当offset>0时,图片向右移动,看到左边部分
    const centerX = 0.5
    const offsetRatio = -(imageOffset.value.x / 100) * visibleWidthRatio

    x1 = centerX - visibleWidthRatio / 2 + offsetRatio
    x2 = centerX + visibleWidthRatio / 2 + offsetRatio
    y1 = 0
    y2 = 1
  }
  else {
    // 图片比预览区域高 → 宽度占满,高度超出,可以上下拖动
    // 预览区域看到的是原图的全部宽度,部分高度

    // 预览区域高度占原图高度的比例
    // 图片宽度 = W, 图片高度 = H, imgAspect = W/H
    // 裁剪框宽度 = W (占满), 裁剪框高度 = W / containerAspect
    // 可见高度比例 = (W / containerAspect) / H = W / (containerAspect * H) = (W/H) / containerAspect
    const visibleHeightRatio = imgAspect / containerAspect

    // 同理,转换Y轴偏移
    const centerY = 0.5
    const offsetRatio = -(imageOffset.value.y / 100) * visibleHeightRatio

    x1 = 0
    x2 = 1
    y1 = centerY - visibleHeightRatio / 2 + offsetRatio
    y2 = centerY + visibleHeightRatio / 2 + offsetRatio
  }

  // 格式化坐标值：0和1不显示小数，其他保留6位小数
  const formatCoord = (val: number) => {
    if (val === 0)
      return `0`
    if (val === 1)
      return `1`
    return val.toFixed(6)
  }

  const cropString = `${formatCoord(x1)}_${formatCoord(y1)}_${formatCoord(x2)}_${formatCoord(y2)}`

  // 保存当前比例的裁剪参数
  savedCrops.value[selectedRatio.value] = cropString

  // 发送两个比例的裁剪参数
  emit(`updateCrop`, savedCrops.value[`2.35:1`], savedCrops.value[`1:1`])
}

// 监听图片加载完成，初始化裁剪区域
function onImageLoad() {
  centerImage()
  // 重置所有比例的偏移量为居中
  savedOffsets.value = {
    '2.35:1': { x: 0, y: 0 },
    '1:1': { x: 0, y: 0 },
  }
  updateCropParameters()
}

// 点击选择图片
function handleSelectImage() {
  emit(`selectImage`)
}

// 获取图片容器样式 - 完整显示原图
function getImageContainerStyle() {
  if (!previewImageRef.value || !imageContainer.value)
    return {}

  const img = previewImageRef.value
  const imgAspect = img.naturalWidth / img.naturalHeight
  const containerAspect = selectedRatio.value === `2.35:1` ? 2.35 : 1

  // 计算图片在容器中的尺寸和位置
  // 目标:让预览区域(容器)是原图的一部分
  let imgWidth, imgHeight

  if (imgAspect > containerAspect) {
    // 图片比预览区域宽 → 以高度为基准,宽度会超出
    // 让图片高度等于容器高度,这样可以左右拖动查看
    imgHeight = 100 // 百分比
    imgWidth = (imgAspect / containerAspect) * 100
  }
  else {
    // 图片比预览区域高 → 以宽度为基准,高度会超出
    // 让图片宽度等于容器宽度,这样可以上下拖动查看
    imgWidth = 100 // 百分比
    imgHeight = (containerAspect / imgAspect) * 100
  }

  return {
    width: `${imgWidth}%`,
    height: `${imgHeight}%`,
    left: `50%`,
    top: `50%`,
    transform: `translate(calc(-50% + ${imageOffset.value.x}%), calc(-50% + ${imageOffset.value.y}%))`,
  }
}

// 获取缩略图样式 - 根据裁剪参数显示裁剪后的区域
function getThumbnailStyle(ratio: `2.35:1` | `1:1`) {
  if (!previewImageRef.value)
    return {}

  const img = previewImageRef.value
  const imgAspect = img.naturalWidth / img.naturalHeight
  const containerAspect = ratio === `2.35:1` ? 2.35 : 1

  // 使用保存的偏移量
  const offset = savedOffsets.value[ratio]

  let imgWidth, imgHeight

  if (imgAspect > containerAspect) {
    // 图片比缩略图宽 → 高度占满,宽度超出
    imgHeight = 100
    imgWidth = (imgAspect / containerAspect) * 100
  }
  else {
    // 图片比缩略图高 → 宽度占满,高度超出
    imgWidth = 100
    imgHeight = (containerAspect / imgAspect) * 100
  }

  return {
    width: `${imgWidth}%`,
    height: `${imgHeight}%`,
    left: `50%`,
    top: `50%`,
    transform: `translate(calc(-50% + ${offset.x}%), calc(-50% + ${offset.y}%))`,
  }
}
</script>

<template>
  <div>
    <!-- 大图预览 - 可拖动图片 -->
    <div
      v-if="imageUrl"
      ref="imageContainer"
      class="relative mx-auto mb-3 cursor-move select-none overflow-hidden border-2 border-gray-300 rounded-lg dark:border-gray-600"
      :style="{
        aspectRatio: selectedRatio === '2.35:1' ? '2.35 / 1' : '1 / 1',
        height: '130px',
      }"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
      @touchstart="startDrag"
      @touchmove="onDrag"
      @touchend="stopDrag"
    >
      <!-- 图片容器 - 完整显示原图,可拖动 -->
      <div
        class="absolute"
        :style="getImageContainerStyle()"
      >
        <!-- 完整的原图 -->
        <img
          ref="previewImageRef"
          :src="imageUrl"
          alt="封面预览"
          class="h-full w-full"
          draggable="false"
          @load="onImageLoad"
          @error="() => $emit('selectImage')"
        >
      </div>

      <!-- 裁剪框边框 - 显示预览区域 -->
      <div class="pointer-events-none absolute inset-0 border-2 border-green-400">
        <!-- 四个角的标记 -->
        <div class="absolute h-3 w-3 border-2 border-green-400 rounded-full bg-white -left-1 -top-1" />
        <div class="absolute h-3 w-3 border-2 border-green-400 rounded-full bg-white -right-1 -top-1" />
        <div class="absolute h-3 w-3 border-2 border-green-400 rounded-full bg-white -bottom-1 -left-1" />
        <div class="absolute h-3 w-3 border-2 border-green-400 rounded-full bg-white -bottom-1 -right-1" />
      </div>

      <!-- 提示文字 -->
      <div class="pointer-events-none absolute bottom-2 left-1/2 rounded bg-black/60 px-3 py-1 text-xs text-white -translate-x-1/2">
        拖动图片选择封面
      </div>
    </div>

    <!-- 比例切换缩略图 -->
    <div v-if="imageUrl" class="mb-3 flex items-center justify-center gap-4">
      <!-- 2.35:1 缩略图 -->
      <div
        class="cursor-pointer transition-all"
        @click="switchCropRatio('2.35:1')"
      >
        <div
          class="relative h-8 overflow-hidden border-2 rounded-lg transition-all"
          :class="selectedRatio === '2.35:1'
            ? 'border-green-500 ring-2 ring-green-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-green-400'"
          style="aspect-ratio: 2.35 / 1;"
        >
          <div
            class="absolute"
            :style="getThumbnailStyle('2.35:1')"
          >
            <img
              :src="imageUrl"
              alt="2.35:1预览"
              class="h-full w-full"
            >
          </div>
        </div>
        <div class="mt-1 text-center text-xs text-gray-600 dark:text-gray-400">
          2.35:1
        </div>
      </div>

      <!-- 1:1 缩略图 -->
      <div
        class="cursor-pointer transition-all"
        @click="switchCropRatio('1:1')"
      >
        <div
          class="relative h-8 overflow-hidden border-2 rounded-lg transition-all"
          :class="selectedRatio === '1:1'
            ? 'border-green-500 ring-2 ring-green-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-green-400'"
          style="aspect-ratio: 1 / 1;"
        >
          <div
            class="absolute"
            :style="getThumbnailStyle('1:1')"
          >
            <img
              :src="imageUrl"
              alt="1:1预览"
              class="h-full w-full"
            >
          </div>
        </div>
        <div class="mt-1 text-center text-xs text-gray-600 dark:text-gray-400">
          1:1
        </div>
      </div>

      <!-- 更换封面链接 -->
      <span
        class="cursor-pointer text-xs text-gray-500 underline transition-colors dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500"
        @click="handleSelectImage"
      >
        更换封面
      </span>
    </div>

    <!-- 占位框 -->
    <div
      v-else
      class="from-gray-100 to-gray-200 bg-gradient-to-br hover:from-green-50 hover:to-blue-50 hover:bg-gradient-to-br dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 flex flex-col cursor-pointer items-center justify-center overflow-hidden border-2 border-gray-300 rounded-lg border-dashed transition-all dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500"
      style="aspect-ratio: 2.35 / 1;"
      @click="handleSelectImage"
    >
      <ImagePlus class="mb-2 size-12 text-gray-400 dark:text-gray-500" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        点击选择封面
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500">
        建议比例 2.35:1 (如: 900x383 像素)
      </p>
    </div>
  </div>
</template>
