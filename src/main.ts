import { createPinia } from 'pinia'
import VConsole from 'vconsole'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setupComponents } from './utils/setup-components'

import 'virtual:uno.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/xq-light.css'
import 'codemirror/theme/darcula.css'

/* 每个页面公共css */
import '@/assets/index.css'
import '@/assets/less/theme.less'

import 'codemirror/mode/css/css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/hint/show-hint'
import 'codemirror/addon/hint/css-hint'
import 'codemirror/addon/search/search' // 搜索功能
import 'codemirror/addon/search/searchcursor'
import 'codemirror/addon/dialog/dialog' // 搜索替换功能
import 'codemirror/addon/dialog/dialog.css'

// 移动端调试工具 - 仅在开发环境启用
if (import.meta.env.DEV) {
  // @ts-expect-error - vConsole 实例在创建后自动附加到 window，不需要显式引用
  const vConsole = new VConsole()
  console.log(`vConsole 已启用 - 点击右下角绿色按钮查看控制台`)
}

setupComponents()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount(`#app`)
