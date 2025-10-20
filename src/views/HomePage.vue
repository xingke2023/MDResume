<script setup lang="ts">
import { Calendar, Send, Share2, Sparkles, TrendingUp, Zap } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function goToEditor() {
  router.push('/editor')
}

function goToNotes() {
  router.push('/notes')
}

// 语言类型
type Language = 'zh-CN' | 'zh-TW' | 'en'
const currentLang = ref<Language>('zh-CN')

// 语言内容
const translations = {
  'zh-CN': {
    siteTitle: '保险文案快速制作及发布系统',
    badge: '✨ 为香港保险中介人量身打造',
    heroTitle1: '公众号文案制作',
    heroTitle2: '及发布利器',
    heroSubtitle: 'AI 智能创作 · 海报文案一键生成 · 多平台同步发布',
    ctaStart: '立即开始创作',
    ctaNotes: '我的灵感笔记',
    featuresTitle: '核心功能',
    featuresSubtitle: '强大的功能组合，让您的内容创作更高效、更专业',
    ctaSectionTitle: '开启高效获客之旅',
    ctaSectionSubtitle: '专为香港保险中介人设计，让您的公众号运营更轻松，获客更高效',
    ctaButton: '开始使用',
    footer: '© 2025 香港保险中介人公众号文案制作系统 · 让营销更简单',
    features: [
      {
        title: '海报制作',
        description: 'AI 智能生成专业保险营销海报，吸引客户眼球',
      },
      {
        title: '文案制作',
        description: 'AI 辅助创作保险产品文案，提升内容质量',
      },
      {
        title: '行业热点文案推送',
        description: '实时推送香港保险行业热点，紧跟市场动态',
      },
      {
        title: '个人写作计划',
        description: '智能规划发文计划，保持内容持续输出',
      },
      {
        title: '一键发布到微信公众号',
        description: '快速发布到微信公众号，节省操作时间',
      },
      {
        title: '一键发布到小红书',
        description: '同步发布到小红书平台，扩大影响力',
      },
    ],
  },
  'zh-TW': {
    siteTitle: '保險文案快速製作及發佈系統',
    badge: '✨ 為香港保險中介人量身打造',
    heroTitle1: '公眾號文案製作',
    heroTitle2: '及發佈利器',
    heroSubtitle: 'AI 智能創作 · 海報文案一鍵生成 · 多平台同步發佈',
    ctaStart: '立即開始創作',
    ctaNotes: '我的靈感筆記',
    featuresTitle: '核心功能',
    featuresSubtitle: '強大的功能組合，讓您的內容創作更高效、更專業',
    ctaSectionTitle: '開啟高效獲客之旅',
    ctaSectionSubtitle: '專為香港保險中介人設計，讓您的公眾號運營更輕鬆，獲客更高效',
    ctaButton: '開始使用',
    footer: '© 2025 香港保險中介人公眾號文案製作系統 · 讓營銷更簡單',
    features: [
      {
        title: '海報製作',
        description: 'AI 智能生成專業保險營銷海報，吸引客戶眼球',
      },
      {
        title: '文案製作',
        description: 'AI 輔助創作保險產品文案，提升內容質量',
      },
      {
        title: '行業熱點文案推送',
        description: '實時推送香港保險行業熱點，緊跟市場動態',
      },
      {
        title: '個人寫作計劃',
        description: '智能規劃發文計劃，保持內容持續輸出',
      },
      {
        title: '一鍵發佈到微信公眾號',
        description: '快速發佈到微信公眾號，節省操作時間',
      },
      {
        title: '一鍵發佈到小紅書',
        description: '同步發佈到小紅書平台，擴大影響力',
      },
    ],
  },
  'en': {
    siteTitle: 'Insurance Content Creation & Publishing System',
    badge: '✨ Tailored for Hong Kong Insurance Intermediaries',
    heroTitle1: 'Official Account Content',
    heroTitle2: 'Creation & Publishing Tool',
    heroSubtitle: 'AI Smart Creation · One-Click Poster & Copy Generation · Multi-Platform Publishing',
    ctaStart: 'Start Creating Now',
    ctaNotes: 'My Inspiration Notes',
    featuresTitle: 'Core Features',
    featuresSubtitle: 'Powerful feature combination for more efficient and professional content creation',
    ctaSectionTitle: 'Start Your Efficient Customer Acquisition Journey',
    ctaSectionSubtitle: 'Designed specifically for Hong Kong insurance intermediaries to make your official account operations easier and customer acquisition more efficient',
    ctaButton: 'Get Started',
    footer: '© 2025 Hong Kong Insurance Intermediary Official Account Content Creation System · Make Marketing Easier',
    features: [
      {
        title: 'Poster Creation',
        description: 'AI-powered professional insurance marketing posters to attract customers',
      },
      {
        title: 'Copywriting',
        description: 'AI-assisted insurance product copywriting to enhance content quality',
      },
      {
        title: 'Industry Trending Content Push',
        description: 'Real-time push of Hong Kong insurance industry trends to keep pace with market dynamics',
      },
      {
        title: 'Personal Writing Plan',
        description: 'Smart planning of publishing schedules to maintain consistent content output',
      },
      {
        title: 'One-Click WeChat Official Account Publishing',
        description: 'Quick publishing to WeChat Official Account, saving operation time',
      },
      {
        title: 'One-Click Xiaohongshu Publishing',
        description: 'Sync publishing to Xiaohongshu platform to expand influence',
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
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-x-hidden">
    <!-- 顶部导航 - 带语言切换 -->
    <header class="absolute top-0 left-0 right-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
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
              class="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200"
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
          <h1 class="text-sm font-bold text-white/90 text-center drop-shadow-lg leading-tight">
            {{ t.siteTitle }}
          </h1>
        </div>

        <!-- 桌面端：水平布局 -->
        <div class="hidden sm:flex items-center justify-between">
          <!-- 语言切换按钮 -->
          <div class="flex items-center gap-2">
            <button
              v-for="lang in [
                { code: 'zh-CN', label: '简体' },
                { code: 'zh-TW', label: '繁體' },
                { code: 'en', label: 'EN' },
              ]"
              :key="lang.code"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
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
          <h1 class="absolute left-1/2 transform -translate-x-1/2 text-xl sm:text-2xl lg:text-3xl font-bold text-white/90 text-center drop-shadow-lg max-w-2xl">
            {{ t.siteTitle }}
          </h1>

          <!-- 占位元素保持布局平衡 -->
          <div class="w-[120px]" />
        </div>
      </div>
    </header>

    <!-- Hero 区域 -->
    <section class="relative px-4 sm:px-6 lg:px-8 pt-28 sm:pt-40 lg:pt-48 pb-16 sm:pb-24 lg:pb-32">
      <!-- 装饰性背景 -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div class="relative max-w-6xl mx-auto text-center">
        <div class="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-fade-in">
          {{ t.badge }}
        </div>

        <h2 class="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white mb-6 sm:mb-8 leading-tight animate-fade-in-up">
          {{ t.heroTitle1 }}
          <span class="block mt-2 bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
            {{ t.heroTitle2 }}
          </span>
        </h2>

        <p class="text-base sm:text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 sm:mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
          {{ t.heroSubtitle }}
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 animate-fade-in-up animation-delay-400">
          <button
            class="group px-8 py-3.5 sm:px-10 sm:py-5 bg-white text-indigo-600 rounded-2xl font-bold text-base sm:text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center max-w-xs"
            @click="goToEditor"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {{ t.ctaStart }}
          </button>

          <button
            class="px-8 py-3.5 sm:px-10 sm:py-5 bg-white/10 text-white rounded-2xl font-bold text-base sm:text-xl backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center max-w-xs"
            @click="goToNotes"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ t.ctaNotes }}
          </button>
        </div>
      </div>
    </section>

    <!-- 功能特性区域 -->
    <section class="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 bg-white rounded-t-[2rem] sm:rounded-t-[4rem]">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-10 sm:mb-16">
          <h3 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            {{ t.featuresTitle }}
          </h3>
          <p class="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            {{ t.featuresSubtitle }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div
            v-for="(feature, index) in t.features"
            :key="feature.title"
            class="group relative bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:-translate-y-2"
            :class="`animate-fade-in-up animation-delay-${index * 100}`"
          >
            <!-- 渐变背景装饰 -->
            <div
              class="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br"
              :class="featureGradients[index]"
            />

            <!-- 图标 -->
            <div
              class="relative inline-flex p-3 sm:p-4 rounded-lg sm:rounded-xl mb-3 sm:mb-4 bg-gradient-to-br shadow-lg"
              :class="featureGradients[index]"
            >
              <component :is="featureIcons[index]" class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>

            <!-- 标题 -->
            <h4 class="relative text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
              {{ feature.title }}
            </h4>

            <!-- 描述 -->
            <p class="relative text-sm sm:text-base text-gray-600 leading-relaxed">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA 区域 -->
    <section class="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-center">
      <div class="max-w-4xl mx-auto">
        <h3 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
          {{ t.ctaSectionTitle }}
        </h3>
        <p class="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
          {{ t.ctaSectionSubtitle }}
        </p>
        <button
          class="px-8 py-3.5 sm:px-10 sm:py-4 bg-white text-indigo-600 rounded-xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 inline-block"
          @click="goToEditor"
        >
          {{ t.ctaButton }}
        </button>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-black/20 backdrop-blur-sm text-center">
      <p class="text-white/70 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto">
        {{ t.footer }}
      </p>
    </footer>
  </div>
</template>

<style scoped>
@keyframes blob {
  0%, 100% {
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
