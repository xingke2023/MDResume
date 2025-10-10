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
  <DropdownMenuContent align="start" class="py-2">
    <DropdownMenuItem class="py-3 text-base" @click="onShowPublishDialog()">
      <MessageCircle class="mr-2 size-5" />
      发布到公众号(草稿箱)
    </DropdownMenuItem>
    <DropdownMenuItem class="py-3 text-base" @click="publishToXiaohongshu()">
      <Share2 class="mr-2 size-5" />
      发布到小红书
    </DropdownMenuItem>
    <DropdownMenuItem class="py-3 text-base" @click="publishToZhihu()">
      <Share2 class="mr-2 size-5" />
      发布到知乎
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem class="py-3 text-base" @click="onCopy('txt')">
      <Copy class="mr-2 size-5" />
      复制公众号格式
    </DropdownMenuItem>
    <DropdownMenuItem class="py-3 text-base" @click="exportEditorContent2PDF()">
      <FileText class="mr-2 size-5" />
      导出pdf文件(只支持电脑端)
    </DropdownMenuItem>
    <DropdownMenuItem class="py-3 text-base" @click="exportEditorContent2HTML()">
      <Code2 class="mr-2 size-5" />
      导出.html
    </DropdownMenuItem>
  </DropdownMenuContent>
</template>
