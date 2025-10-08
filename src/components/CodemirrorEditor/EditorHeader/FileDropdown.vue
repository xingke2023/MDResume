<script setup lang="ts">
import { Code2, Copy, FileText, MessageCircle, Share2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useStore } from '@/stores'

const { onCopy, onShowPublishDialog } = defineProps<{
  copyMode: string
  onCopy: (mode: string) => void
  onShowPublishDialog: () => void
}>()

const store = useStore()

const {
  exportEditorContent2PDF,
  exportEditorContent2HTML,
} = store

// 发布到小红书
function publishToXiaohongshu() {
  toast.info(`发布到小红书功能开发中...`, {
    description: `即将支持一键发布到小红书`,
    duration: 3000,
  })
}

// 发布到知乎
function publishToZhihu() {
  toast.info(`发布到知乎功能开发中...`, {
    description: `即将支持一键发布到知乎`,
    duration: 3000,
  })
}
</script>

<template>
  <MenubarMenu>
    <MenubarTrigger class="px-1.5 py-2 sm:py-1.5 !text-base">
      发布
    </MenubarTrigger>
    <MenubarContent align="start" class="py-2">
      <MenubarItem class="py-3 text-base" @click="onShowPublishDialog()">
        <MessageCircle class="mr-2 size-5" />
        发布到公众号(草稿箱)
      </MenubarItem>
      <MenubarItem class="py-3 text-base" @click="publishToXiaohongshu()">
        <Share2 class="mr-2 size-5" />
        发布到小红书
      </MenubarItem>
      <MenubarItem class="py-3 text-base" @click="publishToZhihu()">
        <Share2 class="mr-2 size-5" />
        发布到知乎
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem class="py-3 text-base" @click="onCopy('txt')">
        <Copy class="mr-2 size-5" />
        复制公众号格式
      </MenubarItem>
      <MenubarItem class="py-3 text-base" @click="exportEditorContent2PDF()">
        <FileText class="mr-2 size-5" />
        导出pdf文件(只支持电脑端)
      </MenubarItem>
      <MenubarItem class="py-3 text-base" @click="exportEditorContent2HTML()">
        <Code2 class="mr-2 size-5" />
        导出.html
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</template>
