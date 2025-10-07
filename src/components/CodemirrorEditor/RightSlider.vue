<script setup lang="ts">
import { Moon, Sun, X } from 'lucide-vue-next'
import PickColors, { type Format } from 'vue-pick-colors'
import {
  codeBlockThemeOptions,
  colorOptions,
  fontFamilyOptions,
  fontSizeOptions,
  legendOptions,
  themeOptions,
  widthOptions,
} from '@/config'
import { useStore } from '@/stores'

const store = useStore()

const { primaryColor } = storeToRefs(store)

const isOpen = ref(false)

const addPostInputVal = ref(``)

watch(isOpen, () => {
  if (isOpen.value) {
    addPostInputVal.value = ``
  }
})

const pickColorsContainer = useTemplateRef<HTMLElement | undefined>(`pickColorsContainer`)
const format = ref<Format>(`rgb`)
const formatOptions = ref<Format[]>([`rgb`, `hex`, `hsl`, `hsv`])
</script>

<template>
  <!-- 手机端：全屏抽屉 -->
  <transition
    v-if="store.isMobile"
    enter-active-class="drawer-enter-active"
    leave-active-class="drawer-leave-active"
  >
    <div
      v-show="store.isOpenRightSlider"
      class="fixed inset-y-0 right-0 z-[100] flex w-full flex-col bg-white dark:bg-[#191919]"
    >
      <!-- 顶部栏 -->
      <div class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#191919]">
        <h2 class="text-lg font-semibold">
          设置
        </h2>
        <Button
          variant="outline"
          size="icon"
          @click="store.isOpenRightSlider = false"
        >
          <X class="size-4" />
        </Button>
      </div>

      <!-- 设置内容 -->
      <div class="space-y-2 flex-1 overflow-auto px-3 py-2">
        <div class="flex items-center gap-2">
          <h2 class="whitespace-nowrap text-xs" style="font-weight: 600;">字体</h2>
          <div class="flex gap-1">
            <Button
              v-for="{ label, value } in fontFamilyOptions" :key="value" variant="outline" size="sm" class="h-7 w-14 text-xs"
              :class="{ 'border-black dark:border-white border-2': store.fontFamily === value }" @click="store.fontChanged(value)"
            >
              {{ label }}
            </Button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <h2 class="whitespace-nowrap text-xs" style="font-weight: 600;">字号</h2>
          <div class="grid flex-1 grid-cols-5 justify-items-center gap-1">
            <Button
              v-for="{ value, desc } in fontSizeOptions" :key="value" variant="outline" size="sm" class="h-7 w-full text-xs" :class="{
                'border-black dark:border-white border-2': store.fontSize === value,
              }" @click="store.sizeChanged(value)"
            >
              {{ desc }}
            </Button>
          </div>
        </div>
        <div class="space-y-1">
          <h2 class="text-xs" style="font-weight: 600;">主题色</h2>
          <div class="grid grid-cols-4 justify-items-center gap-1">
            <Button
              v-for="{ label, value } in colorOptions" :key="value" size="sm" class="h-7 w-full text-xs" variant="outline" :class="{
                'border-black dark:border-white border-2': store.primaryColor === value,
              }" @click="store.colorChanged(value)"
            >
              <span
                class="mr-1.5 inline-block h-3 w-3 rounded-full" :style="{
                  background: value,
                }"
              />
              {{ label }}
            </Button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <h2 class="whitespace-nowrap text-xs" style="font-weight: 600;">自定义主题色</h2>
          <div ref="pickColorsContainer" class="flex-1">
            <PickColors
              v-if="pickColorsContainer" v-model:value="primaryColor" show-alpha :format="format"
              :format-options="formatOptions" :theme="store.isDark ? 'dark' : 'light'"
              :popup-container="pickColorsContainer" @change="store.colorChanged"
            />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <h2 class="whitespace-nowrap text-xs" style="font-weight: 600;">图注格式</h2>
          <div class="flex gap-1">
            <Button
              v-for="{ label, value } in legendOptions" :key="value" size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
                'border-black dark:border-white border-2': store.legend === value,
              }" @click="store.legendChanged(value)"
            >
              {{ label }}
            </Button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <h2 class="whitespace-nowrap text-xs" style="font-weight: 600;">AI 工具箱</h2>
          <div class="flex gap-1">
            <Button
              size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
                'border-black dark:border-white border-2': store.showAIToolbox,
              }" @click="!store.showAIToolbox && store.aiToolboxChanged()"
            >
              开启
            </Button>
            <Button
              size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
                'border-black dark:border-white border-2': !store.showAIToolbox,
              }" @click="store.showAIToolbox && store.aiToolboxChanged()"
            >
              关闭
            </Button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <h2 class="whitespace-nowrap text-xs" style="font-weight: 600;">微信外链转底部引用</h2>
          <div class="flex gap-1">
            <Button
              size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
                'border-black dark:border-white border-2': store.isCiteStatus,
              }" @click="!store.isCiteStatus && store.citeStatusChanged()"
            >
              开启
            </Button>
            <Button
              size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
                'border-black dark:border-white border-2': !store.isCiteStatus,
              }" @click="store.isCiteStatus && store.citeStatusChanged()"
            >
              关闭
            </Button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <h2 class="whitespace-nowrap text-xs" style="font-weight: 600;">段落首行缩进</h2>
          <div class="flex gap-1">
            <Button
              size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
                'border-black dark:border-white border-2': store.isUseIndent,
              }" @click="!store.isUseIndent && store.useIndentChanged()"
            >
              开启
            </Button>
            <Button
              size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
                'border-black dark:border-white border-2': !store.isUseIndent,
              }" @click="store.isUseIndent && store.useIndentChanged()"
            >
              关闭
            </Button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <h2 class="whitespace-nowrap text-xs" style="font-weight: 600;">预览模式</h2>
          <div class="grid flex-1 grid-cols-5 justify-items-center gap-1">
            <Button
              v-for="{ label, value } in widthOptions" :key="value" size="sm" class="h-7 w-full text-xs" variant="outline" :class="{
                'border-black dark:border-white border-2': store.previewWidth === value,
              }" @click="store.previewWidthChanged(value)"
            >
              {{ label }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- 桌面端：侧边栏 -->
  <div
    v-else
    class="relative overflow-hidden border-l-2 border-gray/20 bg-white transition-all duration-300 dark:bg-[#191919]"
    :class="[store.isOpenRightSlider ? 'w-[45%]' : 'w-0 border-l-0']"
  >
    <div
      class="space-y-2 h-full overflow-auto px-3 py-2 transition-transform" :class="{
        'translate-x-0': store.isOpenRightSlider,
        'translate-x-full': !store.isOpenRightSlider,
      }"
    >
      <div class="space-y-1">
        <h2 class="text-xs" style="font-weight: 600;">主题</h2>
        <div class="grid grid-cols-3 justify-items-center gap-1">
          <Button
            v-for="{ label, value } in themeOptions" :key="value" size="sm" class="h-7 w-full text-xs" variant="outline" :class="{
              'border-black dark:border-white border-2': store.theme === value,
            }" @click="store.themeChanged(value)"
          >
            {{ label }}
          </Button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <h2 class="whitespace-nowrap text-sm" style="font-weight: 600;">字体</h2>
        <div class="flex gap-1">
          <Button
            v-for="{ label, value } in fontFamilyOptions" :key="value" variant="outline" size="sm" class="h-7 w-14 text-xs"
            :class="{ 'border-black dark:border-white border-2': store.fontFamily === value }" @click="store.fontChanged(value)"
          >
            {{ label }}
          </Button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <h2 class="whitespace-nowrap text-sm" style="font-weight: 600;">字号</h2>
        <div class="grid flex-1 grid-cols-5 justify-items-center gap-1">
          <Button
            v-for="{ value, desc } in fontSizeOptions" :key="value" variant="outline" size="sm" class="h-7 w-full text-xs" :class="{
              'border-black dark:border-white border-2': store.fontSize === value,
            }" @click="store.sizeChanged(value)"
          >
            {{ desc }}
          </Button>
        </div>
      </div>
      <div class="space-y-1">
        <h2 class="text-xs" style="font-weight: 600;">主题色</h2>
        <div class="grid grid-cols-3 justify-items-center gap-1">
          <Button
            v-for="{ label, value } in colorOptions" :key="value" size="sm" class="h-7 w-full text-xs" variant="outline" :class="{
              'border-black dark:border-white border-2': store.primaryColor === value,
            }" @click="store.colorChanged(value)"
          >
            <span
              class="mr-1.5 inline-block h-3 w-3 rounded-full" :style="{
                background: value,
              }"
            />
            {{ label }}
          </Button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <h2 class="whitespace-nowrap text-sm" style="font-weight: 600;">自定义主题色</h2>
        <div ref="pickColorsContainer" class="flex-1">
          <PickColors
            v-if="pickColorsContainer" v-model:value="primaryColor" show-alpha :format="format"
            :format-options="formatOptions" :theme="store.isDark ? 'dark' : 'light'"
            :popup-container="pickColorsContainer" @change="store.colorChanged"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <h2 class="whitespace-nowrap text-sm" style="font-weight: 600;">图注格式</h2>
        <div class="flex gap-1">
          <Button
            v-for="{ label, value } in legendOptions" :key="value" size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
              'border-black dark:border-white border-2': store.legend === value,
            }" @click="store.legendChanged(value)"
          >
            {{ label }}
          </Button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <h2 class="whitespace-nowrap text-sm" style="font-weight: 600;">AI 工具箱</h2>
        <div class="flex gap-1">
          <Button
            size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
              'border-black dark:border-white border-2': store.showAIToolbox,
            }" @click="!store.showAIToolbox && store.aiToolboxChanged()"
          >
            开启
          </Button>
          <Button
            size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
              'border-black dark:border-white border-2': !store.showAIToolbox,
            }" @click="store.showAIToolbox && store.aiToolboxChanged()"
          >
            关闭
          </Button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <h2 class="whitespace-nowrap text-sm" style="font-weight: 600;">微信外链转底部引用</h2>
        <div class="flex gap-1">
          <Button
            size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
              'border-black dark:border-white border-2': store.isCiteStatus,
            }" @click="!store.isCiteStatus && store.citeStatusChanged()"
          >
            开启
          </Button>
          <Button
            size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
              'border-black dark:border-white border-2': !store.isCiteStatus,
            }" @click="store.isCiteStatus && store.citeStatusChanged()"
          >
            关闭
          </Button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <h2 class="whitespace-nowrap text-sm" style="font-weight: 600;">段落首行缩进</h2>
        <div class="flex gap-1">
          <Button
            size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
              'border-black dark:border-white border-2': store.isUseIndent,
            }" @click="!store.isUseIndent && store.useIndentChanged()"
          >
            开启
          </Button>
          <Button
            size="sm" class="h-7 w-14 text-xs" variant="outline" :class="{
              'border-black dark:border-white border-2': !store.isUseIndent,
            }" @click="store.isUseIndent && store.useIndentChanged()"
          >
            关闭
          </Button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <h2 class="whitespace-nowrap text-sm" style="font-weight: 600;">预览模式</h2>
        <div class="grid flex-1 grid-cols-5 justify-items-center gap-1">
          <Button
            v-for="{ label, value } in widthOptions" :key="value" size="sm" class="h-7 w-full text-xs" variant="outline" :class="{
              'border-black dark:border-white border-2': store.previewWidth === value,
            }" @click="store.previewWidthChanged(value)"
          >
            {{ label }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drawer-enter-active {
  animation: slideLeft 0.3s ease-out;
}

.drawer-leave-active {
  animation: slideRight 0.3s ease-out;
}

@keyframes slideLeft {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideRight {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}
</style>
