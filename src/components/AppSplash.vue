<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const loading = ref(true)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 2000)
})

// 语言类型
type Language = 'zh-CN' | 'zh-TW' | 'en'
const currentLang = ref<Language>('zh-CN')

// 语言内容
const translations = {
  'zh-CN': {
    title: '公众号排版发文工具',
    subtitle: '香港保险经纪人工具系列',
    features: 'AI辅助 · 一键排版 · 一键发布',
    footerCompany: '© 2025 Hongkong Macrodata Technology Limited',
    footerSlogan: '简单、高效',
  },
  'zh-TW': {
    title: '公眾號排版發文工具',
    subtitle: '香港保險經紀人工具系列',
    features: 'AI輔助 · 一鍵排版 · 一鍵發布',
    footerCompany: '© 2025 Hongkong Macrodata Technology Limited',
    footerSlogan: '簡單、高效',
  },
  'en': {
    title: 'WeChat Article Publishing Tool',
    subtitle: 'Hong Kong Insurance Broker Tool Suite',
    features: 'AI Assisted · One-Click Formatting · One-Click Publishing',
    footerCompany: '© 2025 Hongkong Macrodata Technology Limited',
    footerSlogan: 'Simple, Efficient',
  },
}

// 当前语言内容
const t = computed(() => translations[currentLang.value])

// 切换语言
function switchLanguage(lang: Language) {
  currentLang.value = lang
}
</script>

<template>
  <transition name="fade">
    <div
      v-if="loading"
      class="bg-gradient-to-br via-blue-700 from-slate-800 to-indigo-900 fixed inset-0 z-[99999] flex flex-col items-center justify-center px-4"
    >
      <!-- 语言切换 - 右上角 -->
      <div class="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-8 sm:top-8">
        <button
          v-for="lang in [
            { code: 'zh-CN', label: '简体' },
            { code: 'zh-TW', label: '繁體' },
            { code: 'en', label: 'EN' },
          ]"
          :key="lang.code"
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
          :class="
            currentLang === lang.code
              ? 'bg-white text-indigo-600 shadow-lg'
              : 'bg-white/20 text-white hover:bg-white/30'
          "
          @click="switchLanguage(lang.code as Language)"
        >
          {{ lang.label }}
        </button>
      </div>

      <!-- 装饰性背景 -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="filter blur-3xl absolute h-[500px] w-[500px] rounded-full bg-blue-500 opacity-20 -right-40 -top-40" />
        <div class="filter blur-3xl absolute h-[500px] w-[500px] rounded-full bg-indigo-500 opacity-20 -bottom-40 -left-40" />
        <div class="filter blur-3xl absolute left-1/2 top-1/2 h-[500px] w-[500px] transform rounded-full bg-cyan-500 opacity-15 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <!-- 主要内容 -->
      <div class="relative mx-auto w-full max-w-2xl text-center">
        <!-- 标题 -->
        <h1 class="mb-6 mt-40 text-4xl text-white font-bold tracking-tight shadow-2xl sm:text-5xl md:text-6xl" style="text-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4);">
          {{ t.title }}
        </h1>

        <!-- 描述 -->
        <p class="mb-0 text-lg text-white/70 leading-relaxed sm:text-xl">
          {{ t.subtitle }}
        </p>
        <p class="mb-12 text-lg text-white/70 leading-relaxed sm:text-xl">
          {{ t.features }}
        </p>
      </div>

      <!-- 页脚 -->
      <footer class="relative mt-40 py-6 text-center">
        <p class="text-sm text-white/70">
          {{ t.footerCompany }}
        </p>
        <p class="mt-2 text-xs text-white/60">
          {{ t.footerSlogan }}
        </p>
      </footer>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}
</style>
