# 主题文件结构

## 文件说明

```
themes/
├── index.ts          # 主题导出和配置
├── default.ts        # 默认经典主题
├── grace.ts          # 优雅主题 (@brzhang)
├── simple.ts         # 简洁主题 (@okooo5km)
├── typora-ayu.ts     # Typora Ayu 主题
└── README.md         # 本文档
```

## 如何添加新主题

### 1. 创建主题文件

在 `themes/` 文件夹下创建新的主题文件，例如 `my-theme.ts`：

```typescript
import { toMerged } from 'es-toolkit'
import type { Theme } from '@/types'
import { defaultTheme } from './default'

export const myTheme: Theme = toMerged(defaultTheme, {
  base: {
    '--md-primary-color': `#your-color`,
    // 其他基础样式
  },
  block: {
    h1: {
      // h1 样式覆盖
    },
    // 其他块级元素样式
  },
  inline: {
    strong: {
      // 行内元素样式覆盖
    },
    // 其他行内元素样式
  },
})
```

### 2. 更新索引文件

在 `index.ts` 中导入和注册新主题：

```typescript
// 1. 导入新主题
import { myTheme } from './my-theme'

// 2. 添加到 themeMap
export const themeMap = {
  default: defaultTheme,
  grace: graceTheme,
  simple: simpleTheme,
  typoraAyu: typoraAyuTheme,
  myTheme, // 新增
}

// 3. 添加到选项列表
export const themeOptions: IConfigOption<keyof typeof themeMap>[] = [
  // ... 现有选项
  {
    label: `我的主题`,
    value: `myTheme`,
    desc: `@your-name`,
  },
]
```

## 主题开发指南

### 基础样式 (base)

- `--md-primary-color`: 主题色变量
- `text-align`: 文本对齐
- `line-height`: 行高
- `font-family`: 字体族

### 块级元素 (block)

- `container`: 顶层容器
- `h1`-`h6`: 标题样式
- `p`: 段落样式
- `blockquote`: 引用样式
- `code_pre`: 代码块样式
- `image`: 图片样式
- `ol`/`ul`: 列表样式

### 行内元素 (inline)

- `strong`: 粗体样式
- `em`: 斜体样式
- `link`: 链接样式
- `codespan`: 行内代码样式
- `table`/`thead`/`td`: 表格样式

### 最佳实践

1. **继承默认主题**: 使用 `toMerged(defaultTheme, {...})` 继承基础样式
2. **使用主题色变量**: 用 `var(--md-primary-color)` 保持颜色一致性
3. **相对单位**: 使用 `em` 而非 `px` 确保字体大小可缩放
4. **渐进增强**: 只覆盖需要修改的样式属性

## 注意事项

- 主题文件会被自动加载，无需手动导入
- 修改现有主题文件后需要重新构建项目
- 建议为每个主题提供作者信息和描述
