<script setup lang='ts'>
import { onMounted } from 'vue'
import { removeLeft } from '@/utils'

// 固定的自定义上传代码
const fixedCode = removeLeft(`
  const { file, util, okCb, errCb } = CUSTOM_ARG
  const param = new FormData()
  param.append('media', file)
  util.axios.post('https://wechat.easy-write.com/api/media/upload-image', param, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-API-Key': '0dbe66d87befa7a9d5d7c1bdbc631a9b7dc5ce88be9a20e41c26790060802647'
    }
  }).then(res => {
    okCb(res.data.url)
  }).catch(err => {
    errCb(err)
  })
`).trim()

// 自动保存固定代码到 localStorage
onMounted(() => {
  localStorage.setItem(`formCustomConfig`, fixedCode)
})
</script>

<template>
  <div class="space-y-4">
    <div class="bg-muted/50 border rounded-lg p-4">
      <p class="text-muted-foreground text-sm">
        自定义上传已配置为使用微信图床服务
      </p>
      <p class="text-muted-foreground mt-2 text-xs">
        图片将自动上传到微信图床，无需额外配置
      </p>
    </div>
  </div>
</template>
