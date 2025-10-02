<script setup lang="ts">
import { Award, Briefcase, Calendar, ChevronDown, Code, FileText, Heart, Image, List, Mail, Plus, Quote, Table, Target, Type, User, UserCircle, X, Zap } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import useAIConfigStore from '@/stores/AIConfig'

interface PresetItem {
  name: string
  icon: any
  content: string
  category: string
}

// 预设内容配置
const presetItems: PresetItem[] = [
  {
    name: `标题`,
    icon: Type,
    content: `# 标题\n\n`,
    category: `basic`,
  },
  {
    name: `列表`,
    icon: List,
    content: `- 列表项1\n- 列表项2\n- 列表项3\n\n`,
    category: `basic`,
  },
  {
    name: `代码块`,
    icon: Code,
    content: `\`\`\`javascript\n// 代码内容\nconsole.log("Hello World");\n\`\`\`\n\n`,
    category: `code`,
  },
  {
    name: `表格`,
    icon: Table,
    content: `| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容1 | 内容2 | 内容3 |\n| 内容4 | 内容5 | 内容6 |\n\n`,
    category: `advanced`,
  },
  {
    name: `引用`,
    icon: Quote,
    content: `> 这是一个引用块\n> 可以包含多行内容\n\n`,
    category: `basic`,
  },
  {
    name: `图片`,
    icon: Image,
    content: `![图片描述](图片链接)\n\n`,
    category: `media`,
  },
  {
    name: `日期`,
    icon: Calendar,
    content: `**日期：** ${new Date().toLocaleDateString(`zh-CN`)}\n\n`,
    category: `utility`,
  },
  // 简历模块 - 必填配置项
  {
    name: `我的情况`,
    icon: UserCircle,
    content: ``,
    category: `resume`,
  },
  {
    name: `岗位需求`,
    icon: Target,
    content: ``,
    category: `resume`,
  },
  // 简历模块 - 生成内容
  {
    name: `个人信息`,
    icon: User,
    content: `## 个人信息

**姓名：** 张三  
**性别：** 男  
**年龄：** 28岁  
**学历：** 本科  
**专业：** 计算机科学与技术  
**工作年限：** 5年  
**现居地：** 北京市  

`,
    category: `resume`,
  },
  {
    name: `工作经历`,
    icon: Briefcase,
    content: `## 工作经历

### ABC科技有限公司 | 高级前端开发工程师
**工作时间：** 2021.03 - 至今

**主要职责：**
- 负责公司核心产品的前端开发和架构设计
- 带领团队完成多个重要项目的技术攻关
- 参与产品需求分析和技术方案制定

**主要成就：**
- 成功重构了公司主要产品的前端架构，提升性能30%
- 主导开发了新一代用户管理系统，获得用户好评

### XYZ互联网公司 | 前端开发工程师
**工作时间：** 2019.06 - 2021.03

**主要职责：**
- 负责移动端H5页面的开发和维护
- 参与小程序开发和优化
- 协助后端进行接口联调和问题排查

`,
    category: `resume`,
  },
  {
    name: `能力证明`,
    icon: Award,
    content: `## 能力证明

### 项目经验

**电商平台前端重构项目**
- **项目描述：** 对公司核心电商平台进行全面重构，采用Vue 3 + TypeScript技术栈
- **个人贡献：** 担任前端架构师，设计整体架构方案，制定开发规范
- **项目成果：** 页面加载速度提升40%，代码可维护性显著提升

**智能客服系统**
- **项目描述：** 基于AI的智能客服系统，包含Web端和移动端
- **个人贡献：** 负责实时通讯模块和AI对话界面开发
- **项目成果：** 系统上线后客服效率提升60%

### 技术成就
- 获得公司年度"技术创新奖"
- 在GitHub上开源项目获得1000+ stars
- 技术博客文章阅读量累计10万+

`,
    category: `resume`,
  },
  {
    name: `技能清单`,
    icon: Zap,
    content: `## 技能清单

### 前端技术
- **框架/库：** Vue.js, React, Angular (熟练)
- **语言：** JavaScript, TypeScript, HTML5, CSS3 (精通)
- **构建工具：** Webpack, Vite, Rollup (熟练)
- **CSS预处理：** Sass, Less, Stylus (熟练)
- **UI框架：** Element Plus, Ant Design, Vuetify (熟练)

### 后端技术
- **语言：** Node.js, Python (了解)
- **数据库：** MySQL, MongoDB, Redis (了解)
- **框架：** Express, Koa (了解)

### 开发工具
- **版本控制：** Git, SVN (熟练)
- **开发环境：** VS Code, WebStorm (熟练)
- **调试工具：** Chrome DevTools, Vue DevTools (熟练)
- **项目管理：** Jira, Trello, 禅道 (熟练)

### 其他技能
- **移动端：** 微信小程序, React Native (了解)
- **设计工具：** Figma, Sketch (基础)
- **测试：** Jest, Cypress (了解)

`,
    category: `resume`,
  },
  {
    name: `联系方式`,
    icon: Mail,
    content: `## 联系方式

📱 **手机：** 138-0000-0000  
📧 **邮箱：** zhangsan@example.com  
🌐 **个人网站：** https://zhangsan.dev  
💼 **LinkedIn：** linkedin.com/in/zhangsan  
🐱 **GitHub：** github.com/zhangsan  
💬 **微信：** zhangsan_dev  

**期望工作地点：** 北京/上海/深圳  
**期望薪资：** 面议  
**到岗时间：** 随时  

`,
    category: `resume`,
  },
  {
    name: `致谢`,
    icon: Heart,
    content: `## 致谢

感谢您花时间阅读我的简历。我对前端开发充满热情，始终保持学习新技术的动力，相信能够为贵公司带来价值。

期待与您进一步沟通交流的机会！

---

*此简历最后更新于 ${new Date().toLocaleDateString(`zh-CN`)}*

`,
    category: `resume`,
  },
  // 论文写作模块
  {
    name: `提纲生成`,
    icon: FileText,
    content: `# 论文题目：[请填写论文题目]

## 摘要
- **研究背景：** [简述研究领域的现状和问题]
- **研究目的：** [明确研究的主要目标]
- **研究方法：** [概述采用的研究方法]
- **主要发现：** [总结主要研究成果]
- **研究意义：** [阐述研究的理论和实践价值]

## 1. 引言
### 1.1 研究背景
- [当前研究领域的发展状况]
- [存在的主要问题和挑战]
- [研究的必要性和紧迫性]

### 1.2 研究目标
- [主要研究目标]
- [具体研究问题]
- [预期达到的效果]

### 1.3 论文结构
- [各章节的主要内容安排]

## 2. 文献综述
### 2.1 理论基础
- [相关理论的梳理]
- [核心概念的界定]

### 2.2 国内外研究现状
- [国外研究进展]
- [国内研究情况]
- [研究空白和不足]

### 2.3 本研究的创新点
- [理论创新]
- [方法创新]
- [应用创新]

## 3. 研究方法
### 3.1 研究设计
- [研究类型和性质]
- [研究框架和路径]

### 3.2 数据收集
- [数据来源]
- [收集方法]
- [样本选择]

### 3.3 分析方法
- [定性分析方法]
- [定量分析工具]
- [技术路线]

## 4. 结果与分析
### 4.1 [第一个主要发现]
- [详细分析和讨论]

### 4.2 [第二个主要发现]  
- [详细分析和讨论]

### 4.3 [第三个主要发现]
- [详细分析和讨论]

## 5. 讨论
### 5.1 结果解释
- [对研究结果的深入解释]
- [与已有研究的对比分析]

### 5.2 理论贡献
- [对相关理论的贡献]
- [新观点和新见解]

### 5.3 实践意义
- [对实践的指导作用]
- [政策建议和管理启示]

## 6. 结论
### 6.1 主要结论
- [核心研究结论]
- [重要发现总结]

### 6.2 研究局限性
- [研究的不足和限制]
- [需要进一步改进的地方]

### 6.3 未来研究方向
- [后续研究的建议]
- [有待深入探讨的问题]

## 参考文献
[按照学术规范格式列出参考文献]

## 附录
- [调查问卷]
- [访谈提纲]
- [数据表格]
- [其他补充材料]

---

*提纲生成时间：${new Date().toLocaleDateString(`zh-CN`)}*

`,
    category: `paper`,
  },
]

const categories = [
  { key: `basic`, name: `基础` },
  { key: `code`, name: `代码` },
  { key: `advanced`, name: `高级` },
  { key: `media`, name: `媒体` },
  { key: `utility`, name: `工具` },
  { key: `resume`, name: `简历编写` },
  { key: `paper`, name: `论文写作` },
]

const selectedCategory = ref(`resume`)
const showCategoryMenu = ref(false)
const showJobRequirementDialog = ref(false)
const jobRequirement = ref(``)
const showMyInfoDialog = ref(false)
const myInfo = ref(``)
const isGenerating = ref(false)
const generatingText = ref(``)
const store = useStore()

// 关闭面板
function closePanel() {
  store.isOpenPresetPanel = false
}

// AI配置
const AIConfigStore = useAIConfigStore()
const { apiKey, endpoint, model, temperature, maxToken, type } = storeToRefs(AIConfigStore)

// 获取当前分类的预设项
const filteredItems = computed(() => {
  return presetItems.filter(item => item.category === selectedCategory.value)
})

// 获取当前分类的显示名称
const currentCategoryName = computed(() => {
  return categories.find(cat => cat.key === selectedCategory.value)?.name || `基础`
})

// 选择分类
function selectCategory(categoryKey: string) {
  selectedCategory.value = categoryKey
  showCategoryMenu.value = false
}

// 切换分类菜单显示状态
function toggleCategoryMenu() {
  showCategoryMenu.value = !showCategoryMenu.value
}

// 处理按钮点击
function handleItemClick(item: PresetItem) {
  if (item.name === `岗位需求`) {
    showJobRequirementDialog.value = true
  }
  else if (item.name === `我的情况`) {
    showMyInfoDialog.value = true
  }
  else if ([`工作经历`, `能力证明`, `技能清单`, `个人信息`, `联系方式`, `致谢`].includes(item.name)) {
    // 检查必填项
    const missingItems = []
    if (!myInfo.value.trim()) {
      missingItems.push(`我的情况`)
    }
    if (!jobRequirement.value.trim()) {
      missingItems.push(`岗位需求`)
    }

    if (missingItems.length > 0) {
      toast.error(`请先输入${missingItems.join(`和`)}`)
      return
    }

    // 都有内容时使用AI生成
    generateAIContent(item.name, item.content)
  }
  else {
    insertContent(item.content)
  }
}

// 保存岗位需求
function saveJobRequirement() {
  if (!jobRequirement.value.trim()) {
    toast.error(`请输入岗位需求`)
    return
  }
  showJobRequirementDialog.value = false
  toast.success(`岗位需求已保存，现在可以使用AI生成对应的简历内容`)
}

// 保存我的情况
function saveMyInfo() {
  if (!myInfo.value.trim()) {
    toast.error(`请输入个人信息`)
    return
  }
  showMyInfoDialog.value = false
  toast.success(`个人信息已保存，AI生成时将参考这些信息`)
}

// AI生成内容
async function generateAIContent(contentType: string, defaultContent: string) {
  if (!apiKey.value && type.value !== `default`) {
    toast.error(`请先配置AI API密钥`)
    return
  }

  // 显示生成进度
  isGenerating.value = true
  generatingText.value = `正在生成${contentType}...`

  try {
    let prompt = ``

    // 根据内容类型构建不同的提示词
    if ([`工作经历`, `能力证明`, `技能清单`].includes(contentType)) {
      // 需要岗位需求的内容
      let personalContext = ``
      if (myInfo.value.trim()) {
        personalContext = `\n\n个人信息参考：\n${myInfo.value.trim()}\n`
      }

      if (contentType === `工作经历`) {
        prompt = `请根据以下岗位需求和个人信息生成专业的工作经历部分：\n\n岗位需求：${jobRequirement.value}${personalContext}\n\n要求：\n1. 结合个人信息生成2-3段真实可信的工作经历\n2. 包含公司名称、职位、工作时间、主要职责和成就\n3. 突出与岗位需求匹配的技能和经验\n4. 参考个人信息中的内容进行优化和改进\n5. 使用Markdown格式，以"## 工作经历"开头\n6. 不要包含任何说明文字，直接输出内容`
      }
      else if (contentType === `能力证明`) {
        prompt = `请根据以下岗位需求和个人信息生成专业的能力证明部分：\n\n岗位需求：${jobRequirement.value}${personalContext}\n\n要求：\n1. 包含项目经验和技术成就两个部分\n2. 结合个人信息，项目经验要突出与岗位相关的技术栈和贡献\n3. 技术成就要量化展示专业能力\n4. 参考个人信息中的内容进行优化和改进\n5. 使用Markdown格式，以"## 能力证明"开头\n6. 不要包含任何说明文字，直接输出内容`
      }
      else if (contentType === `技能清单`) {
        prompt = `请根据以下岗位需求和个人信息生成专业的技能清单部分：\n\n岗位需求：${jobRequirement.value}${personalContext}\n\n要求：\n1. 按照技术分类组织技能，突出与岗位需求匹配的核心技能\n2. 结合个人信息，标注熟练程度（精通、熟练、了解）\n3. 包含编程语言、框架、工具、数据库等分类\n4. 参考个人信息中的内容进行优化和改进\n5. 使用Markdown格式，以"## 技能清单"开头\n6. 不要包含任何说明文字，直接输出内容`
      }
    }
    else if ([`个人信息`, `联系方式`, `致谢`].includes(contentType)) {
      // 只需要个人信息的内容
      if (contentType === `个人信息`) {
        prompt = `请根据以下个人信息生成专业的个人信息部分：\n\n个人信息：${myInfo.value}\n\n要求：\n1. 提取并整理基本信息（姓名、性别、年龄、学历、专业、工作年限、现居地等）\n2. 格式整齐，信息准确\n3. 使用Markdown格式，以"## 个人信息"开头\n4. 不要包含任何说明文字，直接输出内容`
      }
      else if (contentType === `联系方式`) {
        prompt = `请根据以下个人信息生成专业的联系方式部分：\n\n个人信息：${myInfo.value}\n\n要求：\n1. 提取联系方式信息（手机、邮箱、个人网站、GitHub、LinkedIn、微信等）\n2. 可以适当添加期望工作地点、期望薪资、到岗时间等求职相关信息\n3. 使用合适的图标或格式美化\n4. 使用Markdown格式，以"## 联系方式"开头\n5. 不要包含任何说明文字，直接输出内容`
      }
      else if (contentType === `致谢`) {
        prompt = `请根据以下个人信息生成专业的致谢部分：\n\n个人信息：${myInfo.value}\n\n要求：\n1. 结合个人背景写一段真诚的致谢语\n2. 体现对岗位的热情和职业态度\n3. 语言得体、专业\n4. 使用Markdown格式，以"## 致谢"开头\n5. 包含简历更新时间\n6. 不要包含任何说明文字，直接输出内容`
      }
    }

    const aiContent = await callAI(prompt)
    if (aiContent.trim()) {
      insertContent(aiContent)
      toast.success(`${contentType}已生成完成`)
    }
    else {
      throw new Error(`AI返回内容为空`)
    }
  }
  catch (error) {
    console.error(`AI生成失败:`, error)
    toast.error(`AI生成失败，使用默认模板`)
    insertContent(defaultContent)
  }
  finally {
    isGenerating.value = false
    generatingText.value = ``
  }
}

// 调用AI API
async function callAI(prompt: string): Promise<string> {
  const messages = [
    { role: `system`, content: `你是一个专业的简历写作助手，请根据用户提供的岗位需求生成高质量的简历内容。` },
    { role: `user`, content: prompt },
  ]

  const payload = {
    model: model.value,
    messages,
    temperature: temperature.value,
    max_tokens: maxToken.value,
    stream: false,
  }

  const headers: Record<string, string> = {
    'Content-Type': `application/json`,
  }
  if (apiKey.value && type.value !== `default`) {
    headers.Authorization = `Bearer ${apiKey.value}`
  }

  const url = new URL(endpoint.value)
  if (!url.pathname.endsWith(`/chat/completions`)) {
    url.pathname = url.pathname.replace(/\/?$/, `/chat/completions`)
  }

  const res = await window.fetch(url.toString(), {
    method: `POST`,
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`API请求失败：${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ``
}

// 插入预设内容到编辑器
function insertContent(content: string) {
  const editor = toRaw(store.editor)
  if (!editor || typeof editor.getCursor !== `function`) {
    toast.error(`编辑器未就绪`)
    return
  }

  try {
    // 获取当前光标位置
    const cursor = editor.getCursor()

    // 插入内容，并在末尾添加两个换行符
    const contentWithNewlines = `${content}\n\n`
    editor.replaceSelection(contentWithNewlines)

    // 计算插入后的光标位置（定位到内容末尾的换行符后）
    const lines = contentWithNewlines.split(`\n`)
    const newCursor = {
      line: cursor.line + lines.length - 1,
      ch: 0,
    }

    // 使用 nextTick 确保 DOM 更新完成后再设置光标
    nextTick(() => {
      try {
        editor.setCursor(newCursor)
        editor.focus()
      }
      catch (e) {
        console.warn(`设置光标位置失败:`, e)
        editor.focus()
      }
    })

    toast.success(`内容已插入`)
  }
  catch (error) {
    console.error(`插入内容失败:`, error)
    toast.error(`插入内容失败`)
  }
}
</script>

<template>
  <div class="preset-panel fixed bottom-0 left-0 top-[60px] z-[60] w-[200px] flex flex-col border-r bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
    <!-- 头部：标题 + 关闭按钮 -->
    <div class="flex items-center justify-between border-b p-3 dark:border-gray-700">
      <h3 class="text-base text-gray-900 font-semibold dark:text-gray-100">
        预设内容
      </h3>
      <button
        class="flex items-center justify-center rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        @click="closePanel"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- 主体内容 -->
    <div class="flex flex-1 flex-col overflow-hidden p-3">
      <div class="relative mb-4">
        <!-- 分类选择按钮 -->
        <button
          class="text-foreground w-full flex cursor-pointer items-center justify-center border rounded-md bg-gray-50 px-3 py-2 text-sm font-medium shadow-sm transition-colors dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
          @click="toggleCategoryMenu"
        >
          <span class="flex-1 text-center">{{ currentCategoryName }}</span>
          <ChevronDown
            class="absolute right-3 h-4 w-4 transition-transform duration-200"
            :class="{ 'rotate-180': showCategoryMenu }"
          />
        </button>

        <!-- 分类下拉菜单 -->
        <div
          v-show="showCategoryMenu"
          class="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden border rounded-md bg-white shadow-lg dark:bg-gray-700"
        >
          <button
            v-for="category in categories"
            :key="category.key"
            class="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
            :class="{ 'bg-gray-100 dark:bg-gray-600': selectedCategory === category.key }"
            @click="selectCategory(category.key)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- 预设内容按钮列表 -->
      <div class="space-y-2 flex-1 overflow-y-auto">
        <button
          v-for="item in filteredItems"
          :key="item.name"
          class="w-full flex items-center gap-2 border rounded-lg p-3 text-left text-sm transition-colors"
          :class="{
            'bg-pink-50 border-pink-200 hover:bg-pink-100 dark:bg-pink-900/20 dark:border-pink-800 dark:hover:bg-pink-900/30': ['我的情况', '岗位需求'].includes(item.name),
            'bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/30': selectedCategory === 'resume' && !['我的情况', '岗位需求'].includes(item.name),
            'hover:bg-accent hover:text-accent-foreground': selectedCategory !== 'resume',
          }"
          @click="handleItemClick(item)"
        >
          <component :is="item.icon" class="h-4 w-4 flex-shrink-0" />
          <span>{{ item.name }}</span>
        </button>
      </div>

      <!-- 添加自定义预设按钮 -->
      <div class="border-border mt-4 border-t pt-3">
        <button
          class="text-muted-foreground border-muted-foreground/50 hover:border-border hover:text-foreground w-full flex items-center justify-center gap-2 border rounded-lg border-dashed p-2 text-xs transition-colors"
          @click="toast.info('自定义预设功能开发中...')"
        >
          <Plus class="h-3 w-3" />
          添加自定义
        </button>
      </div>

      <!-- 岗位需求对话框 -->
      <div v-if="showJobRequirementDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="max-w-[90vw] w-[500px] rounded-lg bg-white p-6 dark:bg-gray-800">
          <h3 class="mb-4 text-lg font-semibold">
            输入岗位需求
          </h3>
          <textarea
            v-model="jobRequirement"
            placeholder="可以复制粘贴目标岗位的JobDescription到这里，包括技能要求、工作职责等..."
            class="h-48 w-full resize-none border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div class="mt-4 flex justify-end gap-3">
            <button
              class="border rounded-md px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              @click="showJobRequirementDialog = false"
            >
              取消
            </button>
            <button
              class="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
              @click="saveJobRequirement"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      <!-- 我的情况对话框 -->
      <div v-if="showMyInfoDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="max-w-[90vw] w-[600px] rounded-lg bg-white p-6 dark:bg-gray-800">
          <h3 class="mb-4 text-lg font-semibold">
            我的情况
          </h3>
          <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            请粘贴您的个人信息、工作经历等等内容，格式不限，越乱越好，或者干脆把您的旧简历复制粘贴到这里，也可以只录入基本信息。
          </p>
          <textarea
            v-model="myInfo"
            placeholder=""
            class="h-80 w-full resize-none border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div class="mt-4 flex justify-end gap-3">
            <button
              class="border rounded-md px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              @click="showMyInfoDialog = false"
            >
              取消
            </button>
            <button
              class="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
              @click="saveMyInfo"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      <!-- AI生成进度提示框 -->
      <div v-if="isGenerating" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="w-80 rounded-lg bg-white p-6 dark:bg-gray-800">
          <div class="flex items-center gap-3">
            <div class="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span class="text-sm font-medium">{{ generatingText }}</span>
          </div>
          <div class="mt-4 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <div class="animate-pulse h-2 rounded-full bg-blue-500" style="width: 60%" />
          </div>
          <p class="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            请稍候，AI正在为您生成内容...
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
