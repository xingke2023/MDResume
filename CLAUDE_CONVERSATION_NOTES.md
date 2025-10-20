# Claude Code 对话记录 - 项目分析笔记

> 生成时间: 2025-10-09
> 项目: WeChat Markdown Editor (claudeMd)

## 📌 项目概览

这是一个微信 Markdown 编辑器，支持 Markdown 语法、自定义主题样式、内容管理、多图床、AI 助手等功能。

### 关键技术栈
- **框架**: Vue 3 + TypeScript + Vite
- **状态管理**: Pinia + VueUse
- **编辑器**: CodeMirror
- **Markdown**: marked + highlight.js
- **UI组件**: Radix Vue + Tailwind + UnoCSS
- **存储**: localStorage (浏览器本地存储)

---

## 🗂️ 草稿箱系统详解

### 1. 本地草稿存储

#### 存储位置
- **技术**: 浏览器 `localStorage`
- **库**: 通过 `@vueuse/core` 的 `useStorage` 实现自动持久化
- **主要键名**: `__editor_md__posts`

#### 数据结构
```typescript
interface Post {
  id: string              // UUID 唯一标识
  title: string           // 文章标题
  content: string         // Markdown 内容
  history: {              // 历史记录
    datetime: string
    content: string
  }[]
  createDatetime: Date    // 创建时间
  updateDatetime: Date    // 更新时间
  parentId?: string | null  // 父文章ID (支持树形结构)
  collapsed?: boolean     // 折叠状态
}
```

#### 文件位置
- **核心Store**: `src/stores/index.ts`
- **组件**: `src/components/CodemirrorEditor/PostSlider/`
- **主视图**: `src/views/CodemirrorEditor.vue`

---

### 2. 历史记录功能

#### 自动保存机制
```typescript
// 位置: src/views/CodemirrorEditor.vue:578-598

setInterval(() => {
  const currentPost = store.posts[store.currentPostIndex]

  // 只在内容变化时保存
  const lastRecord = currentPost.history[0]?.content
  if (lastRecord === currentPost.content) {
    return
  }

  // 添加新快照
  currentPost.history.unshift({
    content: currentPost.content,
    datetime: new Date().toLocaleString('zh-CN'),
  })

  // 限制最多 10 条
  currentPost.history.length = Math.min(currentPost.history.length, 10)
}, 30 * 1000)  // 每 30 秒
```

#### 特性
- ⏱️ **自动保存**: 每 30 秒自动保存一次
- 📦 **数量限制**: 每篇文章最多保留 10 条历史记录
- 🔄 **智能判断**: 内容未改变时不保存
- 💾 **完整快照**: 每条记录包含完整内容 + 时间戳
- 🎯 **独立存储**: 每篇文章都有独立的历史记录数组

#### 界面位置
```
左侧边栏 (内容管理)
  └─ 文章右键菜单
      └─ "历史记录" 选项
          ├─ 左侧: 时间列表
          ├─ 右侧: 内容预览
          └─ 底部: [恢复] 按钮
```

---

### 3. 树形结构系统

#### 核心机制
通过 `parentId` 字段建立父子关系：
```typescript
// null 表示根节点
parentId: string | null

// 示例树形结构
posts = [
  { id: 'A', title: '内容1', parentId: null },      // 根节点
  { id: 'B', title: '内容1-1', parentId: 'A' },    // A的子节点
  { id: 'C', title: '内容1-1-1', parentId: 'B' },  // B的子节点（孙节点）
]
```

#### 特性
- ✅ **无限层级**: 支持任意深度的嵌套
- 🖱️ **拖拽重组**: 直接拖动文章即可改变层级关系
- 📁 **折叠展开**: 每个节点都可以独立折叠/展开
- 🔄 **递归渲染**: 组件自递归实现 (`PostItem.vue:154-171`)
- 🛡️ **防止循环**: 不能将父节点拖到子节点下

#### 操作方式
1. **新增子文章**: 文章右键菜单 → "➕ 新增内容"
2. **拖拽调整**: 直接拖动文章到目标位置
3. **折叠/展开**: 点击文章前的箭头图标
4. **全局操作**: 顶部的"全部收起"/"全部展开"按钮

#### 实现细节
```typescript
// 位置: src/components/CodemirrorEditor/PostSlider/PostItem.vue

// 递归渲染子文章
<div v-if="isHasChild(post.id) && !post.collapsed">
  <PostItem
    :parent-id="post.id"      // 传递当前ID作为父ID
    :sorted-posts="sortedPosts"
    ...
  />
</div>

// 判断是否有子文章
function isHasChild(postId: string) {
  return props.sortedPosts.some(p => p.parentId === postId)
}
```

---

### 4. 设计哲学："万物皆文章"

#### 核心理念
- **统一数据结构**: 只有一种 `Post` 类型
- **目录即文章**: 没有单独的"文件夹"类型
- **灵活转换**: 任何文章都可以变成"容器"

#### 优点
- ✅ 代码简洁，只需维护一种数据类型
- ✅ "目录"本身也可以有内容（如章节概述）
- ✅ 灵活性强，任意节点可以转换为父节点
- ✅ 实现成本低，增删改查逻辑统一

#### 潜在改进
- 可以添加视觉区分（文件夹图标 vs 文件图标）
- 可以添加 `type` 字段显式标记类型
- 可以根据 `isHasChild()` 自动判断显示不同图标

---

## 💾 存储限制

### localStorage 容量限制

| 项目 | 限制 |
|------|------|
| **历史记录** | 每篇文章最多 10 条 |
| **文章数量** | 无限制（受总容量限制） |
| **总容量** | 5-10MB（受浏览器限制） |
| **单篇建议** | 不超过 1-2MB（约50-100万字） |

### 浏览器容量对比

| 浏览器 | 容量上限 |
|--------|----------|
| Chrome/Edge | ~10MB |
| Firefox | ~10MB |
| Safari | ~5MB |
| 移动端浏览器 | ~5MB |

### 存储内容统计
所有数据存储在同一个域的 localStorage 中：
- 📄 文章列表 (`__editor_md__posts`) - **主要占用**
- 📜 每篇文章的 10 条历史记录
- 🎨 CSS 自定义方案
- ⚙️ 各种配置项（主题、字体、颜色等）
- 🔑 公众号配置

### 最佳实践建议
1. ✅ **定期导出**: 使用"导出.md"功能备份重要文章
2. ✅ **删除旧文章**: 及时清理不需要的草稿
3. ✅ **监控空间**: 浏览器开发者工具 → Application → Storage
4. ✅ **分散存储**: 重要内容导出为本地文件

---

## 🚀 公众号草稿箱功能

### 发布流程
```
用户点击"发布到公众号(草稿箱)"
  ↓
检查公众号配置（AppID + AppSecret）
  ↓
准备数据：
  - 提取标题（第一个 # 标题）
  - 生成摘要（前50个汉字）
  - 提取封面图（第一张图片）
  - 渲染 Markdown → HTML
  ↓
调用第三方API: api.xingke888.com
  ↓
在公众号后台创建草稿
```

### 关键代码位置
- **主逻辑**: `src/components/CodemirrorEditor/EditorHeader/index.vue:869-994`
- **配置**: `localStorage.mpConfig`
- **API**: `https://api.xingke888.com/api/draft/create-with-credentials`

### 注意事项
- ⚠️ 需要先配置公众号 AppID 和 AppSecret
- ⚠️ 需要将服务器IP添加到公众号白名单
- ℹ️ 不存储在本地，直接发布到微信服务器

---

## 🗺️ 关键文件清单

### 核心文件
```
src/
├── stores/
│   └── index.ts                    # 主状态管理（Post数据结构、CRUD操作）
├── views/
│   └── CodemirrorEditor.vue        # 主编辑器视图（历史记录定时器）
├── components/CodemirrorEditor/
│   ├── PostSlider/
│   │   ├── index.vue              # 侧边栏容器（排序、拖拽逻辑）
│   │   └── PostItem.vue           # 文章列表项（递归渲染、菜单）
│   └── EditorHeader/
│       ├── index.vue              # 顶部工具栏（公众号发布）
│       ├── FileDropdown.vue       # 发布菜单
│       └── WechatPublish/         # 公众号发布相关组件
└── utils/
    └── renderer.ts                # Markdown渲染引擎
```

### 配置文件
```
CLAUDE.md                          # 项目文档（给 Claude Code 的说明）
CLAUDE.local.md                    # 本地私有配置（用户记忆）
```

---

## 🔍 技术亮点

### 1. 响应式持久化
```typescript
// 使用 VueUse 的 useStorage，自动同步到 localStorage
const posts = useStorage<Post[]>('__editor_md__posts', [])

// 任何修改都会自动保存
posts.value.push(newPost)  // ✅ 自动持久化
```

### 2. 扁平存储 + 虚拟树
```typescript
// 所有文章存储在一个扁平数组中
posts: Post[] = [...]

// 通过 parentId 建立虚拟层级关系
// 渲染时递归过滤显示
posts.filter(p => p.parentId === currentParentId)
```

### 3. ID驱动架构
```typescript
// 使用 ID 而非索引定位文章
currentPostId: string  // ✅ 稳定
// vs
currentPostIndex: number  // ❌ 排序/删除后会变

// 兼容旧代码的计算属性
const currentPostIndex = computed({
  get: () => findIndexById(currentPostId.value),
  set: (idx) => { currentPostId.value = posts[idx].id }
})
```

---

## 📝 待优化项

### 性能优化
- [ ] 大量文章时的渲染性能（考虑虚拟滚动）
- [ ] 历史记录的差异存储（目前存完整内容，占用大）

### 功能增强
- [ ] 添加文件夹/文章视觉区分（图标）
- [ ] 支持文章搜索功能
- [ ] 支持标签/分类系统
- [ ] 导出整个树形结构（批量导出）

### 存储优化
- [ ] 添加存储空间监控提示
- [ ] 超出限制时的优雅降级
- [ ] 支持导出到云端（GitHub Gist 等）

---

## 🎯 下一步对话建议

如果需要进一步开发或修改，可以关注：

1. **功能开发**
   - 添加文章搜索功能
   - 实现批量操作（批量导出、批量删除）
   - 添加标签系统

2. **性能优化**
   - 优化大量文章的渲染性能
   - 优化历史记录存储空间

3. **用户体验**
   - 添加更直观的视觉区分（文件夹图标）
   - 添加存储空间使用提示
   - 优化移动端体验

4. **数据安全**
   - 添加云端备份功能
   - 实现导入/导出完整数据

---

## 📚 参考资源

- **项目文档**: `/Users/mi/github/md/CLAUDE.md`
- **主题开发**: `/Users/mi/github/md/src/config/themes/README.md`
- **官方文档**: https://docs.claude.com/en/docs/claude-code/

---

*本文档由 Claude Code 生成，记录了 2025-10-09 的对话要点。*
*保存此文件以便下次对话时快速了解项目状态。*
