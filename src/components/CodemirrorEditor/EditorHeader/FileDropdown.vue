<script setup lang="ts">
import { Copy, FileText } from 'lucide-vue-next'
import { useStore } from '@/stores'

const { onCopy } = defineProps<{
  copyMode: string
  onCopy: (mode: string) => void
}>()

const store = useStore()

const {
  exportEditorContent2PDF,
} = store
</script>

<template>
  <MenubarMenu>
    <MenubarTrigger>
      导出
    </MenubarTrigger>
    <MenubarContent align="start" class="py-2">
      <MenubarItem class="py-2" @click="onCopy('txt')">
        <Copy class="mr-2 size-4" />
        复制公众号格式
      </MenubarItem>
      <MenubarItem class="py-2" @click="exportEditorContent2PDF()">
        <FileText class="mr-2 size-4" />
        导出pdf格式文档
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</template>
