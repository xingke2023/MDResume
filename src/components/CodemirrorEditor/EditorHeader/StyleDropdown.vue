<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import {
  codeBlockThemeOptions,
  colorOptions,
  fontFamilyOptions,
  fontSizeOptions,
  legendOptions,
  themeOptions,
} from '@/config'
import { useDisplayStore, useStore } from '@/stores'

const { onCopy } = defineProps<{
  copyMode: string
  onCopy: (mode: string) => void
}>()

const store = useStore()
const { toggleShowCssEditor } = useDisplayStore()

const {
  theme,
  fontFamily,
  fontSize,
  primaryColor,
  codeBlockTheme,
  legend,
  isMacCodeBlock,
  cssEditor,
  isOpenPostSlider,
  isDark,
} = storeToRefs(store)

const {
  resetStyleConfirm,
  themeChanged,
  fontChanged,
  sizeChanged,
  colorChanged,
  codeBlockThemeChanged,
  legendChanged,
  macCodeBlockChanged,
  toggleDark,
  exportEditorContent2HTML,
  exportEditorContent2PureHTML,
  exportEditorContent2MD,
  downloadAsCardImage,
  exportEditorContent2PDF,
} = store

const importMarkdownContent = useImportMarkdownContent()

// 自定义CSS样式
function customStyle() {
  toggleShowCssEditor()
  setTimeout(() => {
    cssEditor.value!.refresh()
  }, 50)
}
</script>

<template>
  <MenubarMenu>
    <MenubarTrigger>
      <Menu class="size-4" />
    </MenubarTrigger>
    <MenubarContent class="w-56 py-2" align="start">
      <MenubarCheckboxItem class="py-2" :checked="isOpenPostSlider" @click="isOpenPostSlider = !isOpenPostSlider">
        草稿箱
      </MenubarCheckboxItem>
      <MenubarSub>
        <MenubarSubTrigger class="py-2" inset>
          导入导出
        </MenubarSubTrigger>
        <MenubarSubContent class="py-2">
          <MenubarItem class="py-2" @click="onCopy('txt')">
            复制公众号格式
          </MenubarItem>
          <MenubarItem class="py-2" @click="onCopy('html')">
            复制 HTML 格式
          </MenubarItem>
          <MenubarItem class="py-2" @click="onCopy('md')">
            复制 MD 格式
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem class="py-2" @click="importMarkdownContent()">
            导入 .md
          </MenubarItem>
          <MenubarItem class="py-2" @click="exportEditorContent2MD()">
            导出 .md
          </MenubarItem>
          <MenubarItem class="py-2" @click="exportEditorContent2HTML()">
            导出 .html
          </MenubarItem>
          <MenubarItem class="py-2" @click="exportEditorContent2PureHTML()">
            导出 .html（无样式）
          </MenubarItem>
          <MenubarItem class="py-2" @click="exportEditorContent2PDF()">
            导出 .pdf
          </MenubarItem>
          <MenubarItem class="py-2" @click="downloadAsCardImage()">
            导出 .png
          </MenubarItem>
        </MenubarSubContent>
      </MenubarSub>
      <MenubarCheckboxItem class="py-2" :checked="isDark" @click="toggleDark()">
        暗色模式
      </MenubarCheckboxItem>
      <MenubarSeparator />
      <StyleOptionMenu
        title="主题"
        :options="themeOptions"
        :current="theme"
        :change="themeChanged"
      />
      <MenubarSeparator />
      <StyleOptionMenu
        title="字体"
        :options="fontFamilyOptions"
        :current="fontFamily"
        :change="fontChanged"
      />
      <StyleOptionMenu
        title="字号"
        :options="fontSizeOptions"
        :current="fontSize"
        :change="sizeChanged"
      />
      <StyleOptionMenu
        title="主题色"
        :options="colorOptions"
        :current="primaryColor"
        :change="colorChanged"
      />
      <StyleOptionMenu
        title="代码块主题"
        :options="codeBlockThemeOptions"
        :current="codeBlockTheme"
        :change="codeBlockThemeChanged"
      />
      <StyleOptionMenu
        title="图注格式"
        :options="legendOptions"
        :current="legend"
        :change="legendChanged"
      />
      <MenubarSeparator />
      <MenubarCheckboxItem @click="customStyle">
        自定义 CSS
      </MenubarCheckboxItem>
      <MenubarSeparator />
      <MenubarCheckboxItem :checked="isMacCodeBlock" @click="macCodeBlockChanged">
        Mac 代码块
      </MenubarCheckboxItem>
      <MenubarSeparator />
      <MenubarCheckboxItem divided @click="resetStyleConfirm">
        重置自定义样式
      </MenubarCheckboxItem>
    </MenubarContent>
  </MenubarMenu>
</template>
