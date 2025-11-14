<script setup lang="ts">
import { Calendar, ImageIcon, Send, Share2, Sparkles, TrendingUp, Zap } from 'lucide-vue-next'
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
    siteTitle: `香港保险中介人专业营销平台`,
    badge: `🏆 专为香港保险中介人量身打造的营销利器`,
    heroTitle1: `赋能保险中介人`,
    heroTitle2: `打造专业营销影响力`,
    heroSubtitle: `AI 驱动内容创作 · 专业海报设计 · 智能热点追踪 · 多平台一键分发`,
    ctaStart: `开启专业创作`,
    ctaNotes: `营销灵感库`,
    featuresTitle: `专业功能矩阵`,
    featuresSubtitle: `为保险中介人精心打造的全栈营销工具，助力品牌塑造与客户获取`,
    ctaSectionTitle: `立即开启专业营销之旅`,
    ctaSectionSubtitle: `加入数千位香港保险精英，运用专业工具提升客户触达率与转化率`,
    ctaButton: `立即体验`,
    footerCompany: `© 2025 Hongkong Macrodata Technology Limited`,
    footerSlogan: `科技赋能，成就专业`,
    features: [
      {
        title: `AI 专业海报设计`,
        description: `智能生成符合香港市场的保险营销海报，专业视觉呈现提升品牌形象`,
      },
      {
        title: `智能文案创作`,
        description: `基于保险专业知识库，AI 辅助创作高质量产品介绍与市场分析文章`,
      },
      {
        title: `实时行业热点`,
        description: `自动追踪香港保险市场动态与政策变化，第一时间获取专业资讯`,
      },
      {
        title: `营销日历管理`,
        description: `智能规划内容发布节奏，建立持续专业的品牌形象输出`,
      },
      {
        title: `微信公众号直达`,
        description: `一键发布至微信公众号，格式完美适配，专业呈现无需二次调整`,
      },
      {
        title: `小红书营销扩展`,
        description: `同步至小红书平台，扩大专业影响力，触达更多潜在客户群体`,
      },
      {
        title: `专业图库素材库`,
        description: `海量保险行业专业图片与设计素材，随时取用提升内容视觉效果`,
      },
    ],
  },
  'zh-TW': {
    siteTitle: `香港保險中介人專業營銷平台`,
    badge: `🏆 專為香港保險中介人量身打造的營銷利器`,
    heroTitle1: `賦能保險中介人`,
    heroTitle2: `打造專業營銷影響力`,
    heroSubtitle: `AI 驅動內容創作 · 專業海報設計 · 智能熱點追蹤 · 多平台一鍵分發`,
    ctaStart: `開啟專業創作`,
    ctaNotes: `營銷靈感庫`,
    featuresTitle: `專業功能矩陣`,
    featuresSubtitle: `為保險中介人精心打造的全棧營銷工具，助力品牌塑造與客戶獲取`,
    ctaSectionTitle: `立即開啟專業營銷之旅`,
    ctaSectionSubtitle: `加入數千位香港保險精英，運用專業工具提升客戶觸達率與轉化率`,
    ctaButton: `立即體驗`,
    footerCompany: `© 2025 Hongkong Macrodata Technology Limited`,
    footerSlogan: `科技賦能，成就專業`,
    features: [
      {
        title: `AI 專業海報設計`,
        description: `智能生成符合香港市場的保險營銷海報，專業視覺呈現提升品牌形象`,
      },
      {
        title: `智能文案創作`,
        description: `基於保險專業知識庫，AI 輔助創作高質量產品介紹與市場分析文章`,
      },
      {
        title: `實時行業熱點`,
        description: `自動追蹤香港保險市場動態與政策變化，第一時間獲取專業資訊`,
      },
      {
        title: `營銷日曆管理`,
        description: `智能規劃內容發佈節奏，建立持續專業的品牌形象輸出`,
      },
      {
        title: `微信公眾號直達`,
        description: `一鍵發佈至微信公眾號，格式完美適配，專業呈現無需二次調整`,
      },
      {
        title: `小紅書營銷擴展`,
        description: `同步至小紅書平台，擴大專業影響力，觸達更多潛在客戶群體`,
      },
      {
        title: `專業圖庫素材庫`,
        description: `海量保險行業專業圖片與設計素材，隨時取用提升內容視覺效果`,
      },
    ],
  },
  'en': {
    siteTitle: `Professional Marketing Platform for HK Insurance Intermediaries`,
    badge: `🏆 Premium Marketing Arsenal Crafted for Hong Kong Insurance Professionals`,
    heroTitle1: `Empowering Insurance Intermediaries`,
    heroTitle2: `Building Professional Marketing Impact`,
    heroSubtitle: `AI-Driven Content Creation · Professional Poster Design · Smart Trend Tracking · Multi-Platform Distribution`,
    ctaStart: `Start Professional Creation`,
    ctaNotes: `Marketing Idea Library`,
    featuresTitle: `Professional Feature Matrix`,
    featuresSubtitle: `Full-stack marketing toolkit crafted for insurance intermediaries to enhance brand building and client acquisition`,
    ctaSectionTitle: `Begin Your Professional Marketing Journey Today`,
    ctaSectionSubtitle: `Join thousands of Hong Kong insurance elites using professional tools to enhance client reach and conversion rates`,
    ctaButton: `Experience Now`,
    footerCompany: `© 2025 Hongkong Macrodata Technology Limited`,
    footerSlogan: `Technology Empowers Excellence`,
    features: [
      {
        title: `AI Professional Poster Design`,
        description: `Generate insurance marketing posters tailored for Hong Kong market with professional visual presentation to elevate brand image`,
      },
      {
        title: `Intelligent Copywriting`,
        description: `AI-powered content creation based on insurance knowledge base for high-quality product introductions and market analysis`,
      },
      {
        title: `Real-time Industry Insights`,
        description: `Automatically track Hong Kong insurance market dynamics and policy changes for timely professional updates`,
      },
      {
        title: `Marketing Calendar Management`,
        description: `Intelligently plan content publishing rhythm to establish continuous professional brand presence`,
      },
      {
        title: `WeChat Direct Publishing`,
        description: `One-click publishing to WeChat Official Account with perfect format adaptation for professional presentation`,
      },
      {
        title: `Xiaohongshu Marketing Expansion`,
        description: `Sync to Xiaohongshu platform to expand professional influence and reach more potential client groups`,
      },
      {
        title: `Professional Asset Library`,
        description: `Extensive collection of insurance industry images and design assets to enhance visual content quality`,
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
const featureIcons = [Sparkles, Zap, TrendingUp, Calendar, Send, Share2, ImageIcon]
const featureGradients = [
  `from-blue-600 to-indigo-600`,
  `from-indigo-600 to-purple-600`,
  `from-purple-600 to-pink-600`,
  `from-teal-600 to-cyan-600`,
  `from-cyan-600 to-blue-600`,
  `from-pink-600 to-rose-600`,
  `from-violet-600 to-fuchsia-600`,
]
</script>

<template>
  <div class="bg-gradient-to-br via-blue-700 from-slate-800 to-indigo-900 min-h-screen overflow-x-hidden">
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
        <div class="filter blur-3xl animate-blob mix-blend-screen absolute h-[500px] w-[500px] rounded-full bg-blue-500 opacity-20 -right-40 -top-40" />
        <div class="mix-blend-screen filter blur-3xl animate-blob animation-delay-2000 absolute h-[500px] w-[500px] rounded-full bg-indigo-500 opacity-20 -bottom-40 -left-40" />
        <div class="mix-blend-screen filter blur-3xl animate-blob animation-delay-4000 absolute left-1/2 top-1/2 h-[500px] w-[500px] transform rounded-full bg-cyan-500 opacity-15 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div class="relative mx-auto max-w-6xl text-center">
        <div class="backdrop-blur-sm animate-fade-in mb-6 inline-block border-2 border-white/20 rounded-full bg-white/10 px-5 py-2 text-sm text-white font-semibold shadow-lg sm:mb-8 sm:px-6 sm:py-2.5 sm:text-base">
          {{ t.badge }}
        </div>

        <h2 class="animate-fade-in-up mb-6 text-3xl text-white font-extrabold leading-tight tracking-tight sm:mb-8 lg:text-7xl md:text-6xl sm:text-5xl xl:text-8xl">
          {{ t.heroTitle1 }}
          <span class="bg-gradient-to-r bg-clip-text from-amber-300 via-yellow-200 to-cyan-300 mt-2 block text-transparent">
            {{ t.heroTitle2 }}
          </span>
        </h2>

        <p class="animate-fade-in-up animation-delay-200 mx-auto mb-10 max-w-4xl text-base text-white/90 leading-relaxed sm:mb-12 lg:text-3xl md:text-2xl sm:text-xl">
          {{ t.heroSubtitle }}
        </p>

        <div class="animate-fade-in-up animation-delay-400 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <button
            class="group bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 hover:shadow-3xl max-w-xs w-full flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base text-slate-900 font-bold shadow-2xl transition-all duration-300 sm:w-auto hover:scale-105 sm:gap-3 sm:px-12 sm:py-5 sm:text-xl"
            @click="goToEditor"
          >
            <svg class="h-5 w-5 transition-transform sm:h-6 sm:w-6 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {{ t.ctaStart }}
          </button>

          <button
            class="backdrop-blur-sm max-w-xs w-full flex items-center justify-center gap-2 border-2 border-white/40 rounded-2xl bg-white/10 px-8 py-4 text-base text-white font-bold transition-all duration-300 sm:w-auto hover:scale-105 sm:gap-3 hover:border-white/60 hover:bg-white/20 sm:px-12 sm:py-5 sm:text-xl"
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
    <section class="relative rounded-t-[2rem] bg-white px-6 py-12 sm:rounded-t-[4rem] lg:px-8 lg:py-24 sm:px-6 sm:py-20">
      <div class="mx-auto max-w-7xl">
        <div class="mb-10 text-center sm:mb-16">
          <h3 class="mb-3 text-2xl text-gray-900 font-bold sm:mb-4 lg:text-5xl md:text-4xl sm:text-3xl">
            {{ t.featuresTitle }}
          </h3>
          <p class="mx-auto max-w-2xl px-4 text-sm text-gray-600 lg:text-lg sm:text-base">
            {{ t.featuresSubtitle }}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2 lg:gap-8 sm:gap-6">
          <div
            v-for="(feature, index) in t.features"
            :key="feature.title"
            class="group relative border border-gray-200 rounded-2xl bg-white p-6 shadow-md transition-all duration-500 hover:border-indigo-200 sm:rounded-3xl sm:p-8 hover:shadow-xl hover:-translate-y-3"
            :class="`animate-fade-in-up animation-delay-${index * 100}`"
          >
            <!-- 渐变背景装饰 -->
            <div
              class="bg-gradient-to-br absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 sm:rounded-3xl group-hover:opacity-5"
              :class="featureGradients[index]"
            />

            <!-- 图标 -->
            <div
              class="bg-gradient-to-br relative mb-4 inline-flex rounded-xl p-3.5 shadow-md transition-all duration-300 sm:mb-5 group-hover:scale-110 sm:rounded-2xl sm:p-4 group-hover:shadow-lg"
              :class="featureGradients[index]"
            >
              <component :is="featureIcons[index]" class="h-6 w-6 text-white sm:h-7 sm:w-7" />
            </div>

            <!-- 标题 -->
            <h4 class="relative mb-3 text-lg text-gray-900 font-bold transition-colors duration-300 sm:mb-4 sm:text-xl group-hover:text-indigo-600">
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
    <section class="bg-gradient-to-br from-slate-800 to-indigo-900 via-blue-800 relative px-4 py-16 text-center lg:px-8 lg:py-28 sm:px-6 sm:py-24">
      <div class="mx-auto max-w-4xl">
        <h3 class="mb-5 text-2xl text-white font-extrabold tracking-tight sm:mb-7 lg:text-5xl md:text-4xl sm:text-3xl">
          {{ t.ctaSectionTitle }}
        </h3>
        <p class="mx-auto mb-10 max-w-2xl px-4 text-base text-white/90 leading-relaxed sm:mb-12 lg:text-xl md:text-lg sm:text-base">
          {{ t.ctaSectionSubtitle }}
        </p>
        <button
          class="hover:shadow-3xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 inline-block rounded-xl px-10 py-4 text-base text-slate-900 font-bold shadow-2xl transition-all duration-300 hover:scale-105 sm:px-12 sm:py-5 sm:text-lg"
          @click="goToEditor"
        >
          {{ t.ctaButton }}
        </button>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="backdrop-blur-sm bg-black/20 px-4 py-6 text-center lg:px-8 sm:px-6 sm:py-8">
      <p class="mx-auto max-w-4xl text-xs text-white/70 leading-relaxed sm:text-sm">
        {{ t.footerCompany }}
      </p>
      <p class="mt-2 text-xs text-white/60 sm:text-sm">
        {{ t.footerSlogan }}
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
