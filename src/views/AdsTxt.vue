<script setup lang="ts">
// 设置正确的 Content-Type
if (typeof document !== `undefined`) {
  const meta = document.createElement(`meta`)
  meta.httpEquiv = `Content-Type`
  meta.content = `text/plain; charset=utf-8`
  document.head.appendChild(meta)
}
</script>

<template>
  <pre>google.com, pub-2222518687209013, DIRECT, f08c47fec0942fa0</pre>
</template>

<style scoped>
pre {
  margin: 0;
  padding: 0;
  font-family: monospace;
  white-space: pre;
}
</style>
