<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 进入编辑器
function goToEditor() {
  router.push(`/editor`)
}

// 进入笔记
function goToNotes() {
  router.push(`/notes`)
}

// 功能列表
const features = [
  {
    icon: `🎨`,
    title: `海报制作`,
    description: `AI 智能生成专业保险营销海报，吸引客户眼球`,
  },
  {
    icon: `✍️`,
    title: `文案制作`,
    description: `AI 辅助创作保险产品文案，提升内容质量`,
  },
  {
    icon: `📰`,
    title: `行业热点文案推送`,
    description: `实时推送香港保险行业热点，紧跟市场动态`,
  },
  {
    icon: `📅`,
    title: `个人写作计划`,
    description: `智能规划发文计划，保持内容持续输出`,
  },
  {
    icon: `📤`,
    title: `一键发布到微信公众号`,
    description: `快速发布到微信公众号，节省操作时间`,
  },
  {
    icon: `📱`,
    title: `一键发布到小红书`,
    description: `同步发布到小红书平台，扩大影响力`,
  },
]
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航 -->
    <header class="home-header">
      <div class="header-content">
        <h1 class="logo">
          保险文案快速制作及发布系统
        </h1>
        <div class="header-actions">
          <button class="btn-primary" @click="goToEditor">
            开始创作
          </button>
          <button class="btn-secondary" @click="goToNotes">
            📝 灵感笔记
          </button>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="home-main">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <h2 class="hero-title">
            为香港保险中介人打造的公众号文案制作及发布利器
          </h2>
          <p class="hero-subtitle">
            AI 智能创作 · 海报文案一键生成 · 多平台同步发布
          </p>
          <div class="hero-actions">
            <button class="btn-hero" @click="goToEditor">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              立即开始创作
            </button>
            <button class="btn-outline" @click="goToNotes">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              我的灵感笔记
            </button>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section">
        <h3 class="section-title">
          核心功能
        </h3>
        <div class="features-grid">
          <div v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-icon">
              {{ feature.icon }}
            </div>
            <h4 class="feature-title">
              {{ feature.title }}
            </h4>
            <p class="feature-description">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="cta-content">
          <h3 class="cta-title">
            开启高效获客之旅
          </h3>
          <p class="cta-subtitle">
            专为香港保险中介人设计，让您的公众号运营更轻松，获客更高效
          </p>
          <button class="btn-cta" @click="goToEditor">
            开始使用
          </button>
        </div>
      </section>
    </main>

    <!-- 底部 -->
    <footer class="home-footer">
      <p>© 2025 香港保险中介人公众号文案制作系统 · 让营销更简单</p>
    </footer>
  </div>
</template>

<style scoped lang="less">
.home-container {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow-x: hidden;
  overflow-y: auto;
  scroll-behavior: smooth;
}

// 顶部导航
.home-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.25rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;

  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 0.875rem 1rem;
  }
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.logo {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  flex-shrink: 1;
  min-width: 0;

  @media (max-width: 1024px) {
    font-size: 1.25rem;
  }

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9375rem;
    line-height: 1.3;
  }
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
}

// 主要内容
.home-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

// Hero Section
.hero-section {
  padding: 8rem 2rem;
  text-align: center;
  color: #ffffff;

  @media (max-width: 768px) {
    padding: 5rem 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 4rem 1rem;
  }
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
}

.hero-title {
  margin: 0 0 2rem;
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.3;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.75rem;
    line-height: 1.4;
  }
}

.hero-subtitle {
  margin: 0 0 3.5rem;
  font-size: 1.25rem;
  opacity: 0.95;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9375rem;
  }
}

.hero-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 1rem;
    max-width: 300px;
    margin: 0 auto;
  }
}

// Features Section
.features-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 6rem 2rem;
  border-radius: 40px 40px 0 0;

  @media (max-width: 768px) {
    padding: 4rem 1.5rem;
    border-radius: 30px 30px 0 0;
  }

  @media (max-width: 480px) {
    padding: 3rem 1rem;
  }
}

.section-title {
  margin: 0 0 4rem;
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  color: #1a202c;
  letter-spacing: -0.01em;

  @media (max-width: 768px) {
    font-size: 1.75rem;
    margin-bottom: 3rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
}

.features-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2.5rem;

  @media (max-width: 768px) {
    gap: 2rem;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.feature-card {
  background: #ffffff;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
    border-color: rgba(102, 126, 234, 0.1);
  }

  @media (max-width: 768px) {
    padding: 2rem;
  }

  @media (max-width: 480px) {
    padding: 1.75rem;
  }
}

.feature-icon {
  font-size: 3.5rem;
  margin-bottom: 1.25rem;

  @media (max-width: 480px) {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
}

.feature-title {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  letter-spacing: -0.01em;

  @media (max-width: 480px) {
    font-size: 1.125rem;
  }
}

.feature-description {
  margin: 0;
  font-size: 0.9375rem;
  color: #718096;
  line-height: 1.7;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
}

// CTA Section
.cta-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 6rem 2rem;
  text-align: center;
  color: #ffffff;

  @media (max-width: 768px) {
    padding: 4rem 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 3rem 1rem;
  }
}

.cta-content {
  max-width: 800px;
  margin: 0 auto;
}

.cta-title {
  margin: 0 0 1.5rem;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;

  @media (max-width: 768px) {
    font-size: 1.75rem;
    margin-bottom: 1.25rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
}

.cta-subtitle {
  margin: 0 0 3rem;
  font-size: 1.125rem;
  opacity: 0.95;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9375rem;
  }
}

// Footer
.home-footer {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  padding: 2.5rem 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;

  p {
    margin: 0;
    font-weight: 400;
  }

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    font-size: 0.8125rem;
  }

  @media (max-width: 480px) {
    padding: 1.5rem 1rem;
    font-size: 0.75rem;
  }
}

// Button Styles
.btn-primary,
.btn-secondary,
.btn-hero,
.btn-outline,
.btn-cta {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
}

.btn-primary {
  background: #ffffff;
  color: #667eea;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    font-size: 0.9375rem;
    padding: 0.625rem 1.25rem;
  }
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    font-size: 0.9375rem;
    padding: 0.625rem 1.25rem;
  }
}

.btn-hero {
  background: #ffffff;
  color: #667eea;
  font-size: 1.125rem;
  padding: 1rem 2rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);

  &:hover {
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
    transform: translateY(-3px);
  }

  svg {
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0.875rem 1.75rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9375rem;
    padding: 0.75rem 1.5rem;
  }
}

.btn-outline {
  background: transparent;
  color: #ffffff;
  font-size: 1.125rem;
  padding: 1rem 2rem;
  border: 2px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.8);
  }

  svg {
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0.875rem 1.75rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9375rem;
    padding: 0.75rem 1.5rem;
  }
}

.btn-cta {
  background: #ffffff;
  color: #667eea;
  font-size: 1.25rem;
  padding: 1.25rem 3rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);

  &:hover {
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
    transform: translateY(-3px);
  }

  @media (max-width: 768px) {
    font-size: 1.125rem;
    padding: 1rem 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    padding: 0.875rem 2rem;
    width: 100%;
    max-width: 300px;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .features-section {
    background: rgba(26, 32, 44, 0.95);
  }

  .section-title {
    color: #f7fafc;
  }

  .feature-card {
    background: #2d3748;
  }

  .feature-title {
    color: #f7fafc;
  }

  .feature-description {
    color: #cbd5e0;
  }
}
</style>
