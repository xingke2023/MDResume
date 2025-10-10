<script setup lang='ts'>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { List } from 'lucide-vue-next'
import { useStore } from '@/stores'

const store = useStore()

const isOpenHeadingSlider = ref(false)
const tocRef = ref<HTMLElement | null>(null)

// 切换目录展开/收起
const toggleToc = (event: Event) => {
  event.stopPropagation()
  isOpenHeadingSlider.value = !isOpenHeadingSlider.value
}

// 点击目录项后收起并跳转
const handleTocItemClick = (event: Event, url: string) => {
  event.preventDefault() // 阻止默认锚点跳转
  isOpenHeadingSlider.value = false

  // 获取目标元素
  const targetId = url.replace('#', '')
  const targetElement = document.getElementById(targetId)

  if (targetElement) {
    // 获取预览容器
    const previewWrapper = document.querySelector('.preview-wrapper')

    if (previewWrapper) {
      // 计算目标元素相对于容器的位置
      const targetOffset = targetElement.offsetTop
      // 平滑滚动到目标位置，留出一些顶部空间
      previewWrapper.scrollTo({
        top: targetOffset - 20,
        behavior: 'smooth',
      })
    }
  }
}

// 点击外部区域收起目录
const handleClickOutside = (event: MouseEvent) => {
  if (tocRef.value && !tocRef.value.contains(event.target as Node)) {
    isOpenHeadingSlider.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    ref="tocRef"
    class="bg-background absolute left-0 top-0 border rounded-2 rounded-lt-none p-2 text-sm shadow"
  >
    <List class="size-6 cursor-pointer" @click="toggleToc" />
    <ul
      class="overflow-auto transition-all"
      :class="{
        'max-h-0 w-0': !isOpenHeadingSlider,
        'max-h-100 w-60 mt-2': isOpenHeadingSlider,
      }"
    >
      <li
        v-for="(item, index) in store.titleList"
        :key="index"
        class="line-clamp-1 py-1 leading-6 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
        :style="{ paddingLeft: `${item.level - 0.5}em` }"
        @click="(e) => handleTocItemClick(e, item.url)"
      >
        <a :href="item.url" @click.prevent>
          {{ item.title }}
        </a>
      </li>
    </ul>
  </div>
</template>
