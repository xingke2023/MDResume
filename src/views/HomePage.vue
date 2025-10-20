<script setup lang="ts">
import { Calendar, Send, Share2, Sparkles, TrendingUp, Zap } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function goToEditor() {
  router.push(`/editor`)
}

function goToNotes() {
  router.push(`/notes`)
}

// 语言类型
type Language = `zh-CN` | `zh-TW` | `en`
const currentLang = ref<Language>(`zh-CN`)

// 语言内容
const translations = {
  'zh-CN': {
    siteTitle: `保险文案快速制作及发布系统`,
    badge: `✨ 为香港保险中介人量身打造`,
    heroTitle1: `公众号文案制作`,
    heroTitle2: `及发布利器`,
    heroSubtitle: `AI 智能创作 · 海报文案一键生成 · 多平台同步发布`,
    ctaStart: `立即开始创作`,
    ctaNotes: `我的灵感笔记`,
    featuresTitle: `核心功能`,
    featuresSubtitle: `强大的功能组合，让您的内容创作更高效、更专业`,
    ctaSectionTitle: `开启高效获客之旅`,
    ctaSectionSubtitle: `专为香港保险中介人设计，让您的公众号运营更轻松，获客更高效`,
    ctaButton: `开始使用`,
    footer: `© 2025 香港保险中介人公众号文案制作系统 · 让营销更简单`,
    features: [
      {
        title: `海报制作`,
        description: `AI 智能生成专业保险营销海报，吸引客户眼球`,
      },
      {
        title: `文案制作`,
        description: `AI 辅助创作保险产品文案，提升内容质量`,
      },
      {
        title: `行业热点文案推送`,
        description: `实时推送香港保险行业热点，紧跟市场动态`,
      },
      {
        title: `个人写作计划`,
        description: `智能规划发文计划，保持内容持续输出`,
      },
      {
        title: `一键发布到微信公众号`,
        description: `快速发布到微信公众号，节省操作时间`,
      },
      {
        title: `一键发布到小红书`,
        description: `同步发布到小红书平台，扩大影响力`,
      },
    ],
  },
  'zh-TW': {
    siteTitle: `保險文案快速製作及發佈系統`,
    badge: `✨ 為香港保險中介人量身打造`,
    heroTitle1: `公眾號文案製作`,
    heroTitle2: `及發佈利器`,
    heroSubtitle: `AI 智能創作 · 海報文案一鍵生成 · 多平台同步發佈`,
    ctaStart: `立即開始創作`,
    ctaNotes: `我的靈感筆記`,
    featuresTitle: `核心功能`,
    featuresSubtitle: `強大的功能組合，讓您的內容創作更高效、更專業`,
    ctaSectionTitle: `開啟高效獲客之旅`,
    ctaSectionSubtitle: `專為香港保險中介人設計，讓您的公眾號運營更輕鬆，獲客更高效`,
    ctaButton: `開始使用`,
    footer: `© 2025 香港保險中介人公眾號文案製作系統 · 讓營銷更簡單`,
    features: [
      {
        title: `海報製作`,
        description: `AI 智能生成專業保險營銷海報，吸引客戶眼球`,
      },
      {
        title: `文案製作`,
        description: `AI 輔助創作保險產品文案，提升內容質量`,
      },
      {
        title: `行業熱點文案推送`,
        description: `實時推送香港保險行業熱點，緊跟市場動態`,
      },
      {
        title: `個人寫作計劃`,
        description: `智能規劃發文計劃，保持內容持續輸出`,
      },
      {
        title: `一鍵發佈到微信公眾號`,
        description: `快速發佈到微信公眾號，節省操作時間`,
      },
      {
        title: `一鍵發佈到小紅書`,
        description: `同步發佈到小紅書平台，擴大影響力`,
      },
    ],
  },
  'en': {
    siteTitle: `Insurance Content Creation & Publishing System`,
    badge: `✨ Tailored for Hong Kong Insurance Intermediaries`,
    heroTitle1: `Official Account Content`,
    heroTitle2: `Creation & Publishing Tool`,
    heroSubtitle: `AI Smart Creation · One-Click Poster & Copy Generation · Multi-Platform Publishing`,
    ctaStart: `Start Creating Now`,
    ctaNotes: `My Inspiration Notes`,
    featuresTitle: `Core Features`,
    featuresSubtitle: `Powerful feature combination for more efficient and professional content creation`,
    ctaSectionTitle: `Start Your Efficient Customer Acquisition Journey`,
    ctaSectionSubtitle: `Designed specifically for Hong Kong insurance intermediaries to make your official account operations easier and customer acquisition more efficient`,
    ctaButton: `Get Started`,
    footer: `© 2025 Hong Kong Insurance Intermediary Official Account Content Creation System · Make Marketing Easier`,
    features: [
      {
        title: `Poster Creation`,
        description: `AI-powered professional insurance marketing posters to attract customers`,
      },
      {
        title: `Copywriting`,
        description: `AI-assisted insurance product copywriting to enhance content quality`,
      },
      {
        title: `Industry Trending Content Push`,
        description: `Real-time push of Hong Kong insurance industry trends to keep pace with market dynamics`,
      },
      {
        title: `Personal Writing Plan`,
        description: `Smart planning of publishing schedules to maintain consistent content output`,
      },
      {
        title: `One-Click WeChat Official Account Publishing`,
        description: `Quick publishing to WeChat Official Account, saving operation time`,
      },
      {
        title: `One-Click Xiaohongshu Publishing`,
        description: `Sync publishing to Xiaohongshu platform to expand influence`,
      },
    ],
  },
}

// 当前语言内容
const t = computed(() => translations[currentLang.value])

// 切换语言
function switchLanguage(lang: Language) {
  currentLang.value = lang
}

// 功能图标
const featureIcons = [Sparkles, Zap, TrendingUp, Calendar, Send, Share2]
const featureGradients = [
  `from-purple-500 to-pink-500`,
  `from-blue-500 to-cyan-500`,
  `from-green-500 to-emerald-500`,
  `from-orange-500 to-red-500`,
  `from-indigo-500 to-purple-500`,
  `from-pink-500 to-rose-500`,
]
</script>

<template>
  <div class="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 min-h-screen overflow-x-hidden">
    <!-- 顶部导航 - 带语言切换 -->
    <header class="absolute left-0 right-0 top-0 z-50">
      <div class="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-8 sm:px-6 sm:py-6">
        <!-- 移动端：垂直布局 -->
        <div class="flex flex-col gap-3 sm:hidden">
          <!-- 语言切换按钮 - 移动端左对齐 -->
          <div class="flex items-center gap-1.5">
            <button
              v-for="lang in [
                { code: 'zh-CN', label: '简体' },
                { code: 'zh-TW', label: '繁體' },
                { code: 'en', label: 'EN' },
              ]"
              :key="lang.code"
              class="rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200"
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

          <!-- 标题 - 移动端居中显示 -->
          <h1 class="drop-shadow-lg text-center text-sm text-white/90 font-bold leading-tight">
            {{ t.siteTitle }}
          </h1>
        </div>

        <!-- 桌面端：水平布局 -->
        <div class="hidden items-center justify-between sm:flex">
          <!-- 语言切换按钮 -->
          <div class="flex items-center gap-2">
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

          <!-- 标题 - 桌面端 -->
          <h1 class="drop-shadow-lg absolute left-1/2 max-w-2xl transform text-center text-xl text-white/90 font-bold -translate-x-1/2 lg:text-3xl sm:text-2xl">
            {{ t.siteTitle }}
          </h1>

          <!-- 占位元素保持布局平衡 -->
          <div class="w-[120px]" />
        </div>
      </div>
    </header>

    <!-- Hero 区域 -->
    <section class="relative px-4 pb-16 pt-28 lg:px-8 sm:px-6 lg:pb-32 lg:pt-48 sm:pb-24 sm:pt-40">
      <!-- 装饰性背景 -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="mix-blend-multiply filter blur-3xl animate-blob absolute h-96 w-96 rounded-full bg-purple-400 opacity-30 -right-40 -top-40" />
        <div class="mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 absolute h-96 w-96 rounded-full bg-pink-400 opacity-30 -bottom-40 -left-40" />
        <div class="mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 absolute left-1/2 top-1/2 h-96 w-96 transform rounded-full bg-indigo-400 opacity-30 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div class="relative mx-auto max-w-6xl text-center">
        <div class="backdrop-blur-sm animate-fade-in mb-6 inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs text-white font-medium sm:mb-8 sm:text-sm">
          {{ t.badge }}
        </div>

        <h2 class="animate-fade-in-up mb-6 text-3xl text-white font-extrabold leading-tight sm:mb-8 lg:text-7xl md:text-6xl sm:text-5xl xl:text-8xl">
          {{ t.heroTitle1 }}
          <span class="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text mt-2 block text-transparent">
            {{ t.heroTitle2 }}
          </span>
        </h2>

        <p class="animate-fade-in-up animation-delay-200 mx-auto mb-10 max-w-4xl text-base text-white/90 leading-relaxed sm:mb-12 lg:text-3xl md:text-2xl sm:text-xl">
          {{ t.heroSubtitle }}
        </p>

        <div class="animate-fade-in-up animation-delay-400 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
          <button
            class="group hover:shadow-3xl max-w-xs w-full flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-base text-indigo-600 font-bold shadow-2xl transition-all duration-300 sm:w-auto hover:scale-105 sm:gap-3 sm:px-10 sm:py-5 sm:text-xl"
            @click="goToEditor"
          >
            <svg class="h-5 w-5 transition-transform sm:h-6 sm:w-6 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {{ t.ctaStart }}
          </button>

          <button
            class="backdrop-blur-sm max-w-xs w-full flex items-center justify-center gap-2 border-2 border-white/30 rounded-2xl bg-white/10 px-8 py-3.5 text-base text-white font-bold transition-all duration-300 sm:w-auto sm:gap-3 hover:border-white/50 hover:bg-white/20 sm:px-10 sm:py-5 sm:text-xl"
            @click="goToNotes"
          >
            <svg class="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ t.ctaNotes }}
          </button>
        </div>
      </div>
    </section>

    <!-- 功能特性区域 -->
    <section class="relative rounded-t-[2rem] bg-white px-4 py-12 sm:rounded-t-[4rem] lg:px-8 lg:py-24 sm:px-6 sm:py-20">
      <div class="mx-auto max-w-7xl">
        <div class="mb-10 text-center sm:mb-16">
          <h3 class="mb-3 text-2xl text-gray-900 font-bold sm:mb-4 lg:text-5xl md:text-4xl sm:text-3xl">
            {{ t.featuresTitle }}
          </h3>
          <p class="mx-auto max-w-2xl px-4 text-sm text-gray-600 lg:text-lg sm:text-base">
            {{ t.featuresSubtitle }}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2 lg:gap-8 sm:gap-6">
          <div
            v-for="(feature, index) in t.features"
            :key="feature.title"
            class="group relative border border-gray-100 rounded-xl bg-white p-5 shadow-lg transition-all duration-300 hover:border-transparent sm:rounded-2xl sm:p-8 hover:shadow-2xl hover:-translate-y-2"
            :class="`animate-fade-in-up animation-delay-${index * 100}`"
          >
            <!-- 渐变背景装饰 -->
            <div
              class="bg-gradient-to-br absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 sm:rounded-2xl group-hover:opacity-10"
              :class="featureGradients[index]"
            />

            <!-- 图标 -->
            <div
              class="bg-gradient-to-br relative mb-3 inline-flex rounded-lg p-3 shadow-lg sm:mb-4 sm:rounded-xl sm:p-4"
              :class="featureGradients[index]"
            >
              <component :is="featureIcons[index]" class="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>

            <!-- 标题 -->
            <h4 class="relative mb-2 text-lg text-gray-900 font-bold sm:mb-3 sm:text-xl">
              {{ feature.title }}
            </h4>

            <!-- 描述 -->
            <p class="relative text-sm text-gray-600 leading-relaxed sm:text-base">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA 区域 -->
    <section class="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative px-4 py-12 text-center lg:px-8 lg:py-24 sm:px-6 sm:py-20">
      <div class="mx-auto max-w-4xl">
        <h3 class="mb-4 text-2xl text-white font-bold sm:mb-6 lg:text-5xl md:text-4xl sm:text-3xl">
          {{ t.ctaSectionTitle }}
        </h3>
        <p class="mx-auto mb-8 max-w-2xl px-4 text-sm text-white/90 leading-relaxed sm:mb-10 lg:text-xl md:text-lg sm:text-base">
          {{ t.ctaSectionSubtitle }}
        </p>
        <button
          class="hover:shadow-3xl inline-block rounded-xl bg-white px-8 py-3.5 text-base text-indigo-600 font-bold shadow-2xl transition-all duration-300 hover:scale-105 sm:px-10 sm:py-4 sm:text-lg"
          @click="goToEditor"
        >
          {{ t.ctaButton }}
        </button>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="backdrop-blur-sm bg-black/20 px-4 py-6 text-center lg:px-8 sm:px-6 sm:py-8">
      <p class="mx-auto max-w-4xl text-xs text-white/70 leading-relaxed sm:text-sm">
        {{ t.footer }}
      </p>
    </footer>
  </div>
</template>

<style scoped>
@keyframes blob {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out;
}

.animation-delay-100 {
  animation-delay: 0.1s;
}

.animation-delay-200 {
  animation-delay: 0.2s;
}

.animation-delay-300 {
  animation-delay: 0.3s;
}

.animation-delay-400 {
  animation-delay: 0.4s;
}

.animation-delay-500 {
  animation-delay: 0.5s;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
