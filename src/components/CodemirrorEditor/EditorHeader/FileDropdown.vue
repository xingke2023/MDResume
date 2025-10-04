<script setup lang="ts">
import { Code2, Copy, FileText, MessageCircle, Share2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useStore } from '@/stores'

const { onCopy } = defineProps<{
  copyMode: string
  onCopy: (mode: string) => void
}>()

const store = useStore()

const {
  exportEditorContent2PDF,
  exportEditorContent2HTML,
} = store

// 发布到公众号
function publishToWechat() {
  toast.info(`发布到公众号功能开发中...`, {
    description: `即将支持一键发布到微信公众号`,
    duration: 3000,
  })
}

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
    <MenubarTrigger class="px-1.5">
      发布
    </MenubarTrigger>
    <MenubarContent align="start" class="py-2">
      <MenubarItem class="py-3" @click="publishToWechat()">
        <MessageCircle class="mr-2 size-4" />
        发布到公众号草稿箱
      </MenubarItem>
      <MenubarItem class="py-3" @click="publishToXiaohongshu()">
        <Share2 class="mr-2 size-4" />
        发布到小红书
      </MenubarItem>
      <MenubarItem class="py-3" @click="publishToZhihu()">
        <Share2 class="mr-2 size-4" />
        发布到知乎
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem class="py-3" @click="onCopy('txt')">
        <Copy class="mr-2 size-4" />
        复制公众号格式
      </MenubarItem>
      <MenubarItem class="py-3" @click="exportEditorContent2PDF()">
        <FileText class="mr-2 size-4" />
        导出pdf文件(只支持电脑端)
      </MenubarItem>
      <MenubarItem class="py-3" @click="exportEditorContent2HTML()">
        <Code2 class="mr-2 size-4" />
        导出.html
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</template>
