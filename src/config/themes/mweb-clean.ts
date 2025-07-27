import type { Theme } from '@/types'

export const mwebCleanTheme: Theme = {
  base: {
    '--md-primary-color': `#1abc9c`,
    'color': `#333`,
    'background': `#fff`,
    '-webkit-text-size-adjust': `100%`,
    'text-rendering': `optimizeLegibility`,
    'font': `300 1em/1.8 PingFang SC, Lantinghei SC, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
  },
  block: {
    container: {
      'min-width': `200px`,
      'max-width': `760px`,
      'margin': `0 auto`,
      'padding': `1rem`,
      'font-size': `1.3rem`,
    },

    // 重置所有元素的 margin 和 padding
    h1: {
      'margin': `0`,
      'text-align': `center`,
      'padding': `0`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `400`,
      'color': `#000`,
      'line-height': `1.35`,
      'margin-top': `1.2em`,
      'margin-bottom': `0.6em`,
      'font-size': `2em`,
    },
    h2: {
      'margin': `0`,
      'padding': `0`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `100`,
      'color': `#000`,
      'line-height': `1.35`,
      'margin-top': `1.2em`,
      'margin-bottom': `0.6em`,
      'font-size': `1.8em`,
    },
    h3: {
      'margin': `0`,
      'padding': `0`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `100`,
      'color': `#000`,
      'line-height': `1.35`,
      'margin-top': `1.2em`,
      'margin-bottom': `0.6em`,
      'font-size': `1.6em`,
    },
    h4: {
      'margin': `0`,
      'padding': `0`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `100`,
      'color': `#000`,
      'line-height': `1.35`,
      'margin-top': `1.2em`,
      'margin-bottom': `0.6em`,
      'font-size': `1.4em`,
    },
    h5: {
      'margin': `0`,
      'padding': `0`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `100`,
      'color': `#000`,
      'line-height': `1.35`,
      'margin-top': `1.2em`,
      'margin-bottom': `0.6em`,
      'font-size': `1.2em`,
    },
    h6: {
      'margin': `0`,
      'padding': `0`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `100`,
      'color': `#000`,
      'line-height': `1.35`,
      'margin-top': `1.2em`,
      'margin-bottom': `0.6em`,
      'font-size': `1.2em`,
    },

    p: {
      'margin': `0`,
      'padding': `0`,
      'margin-bottom': `1.2em`,
      'color': `#333`,
    },

    blockquote: {
      'padding': `0`,
      'position': `relative`,
      'color': `#999`,
      'font-weight': `400`,
      'border-left': `1px solid #1abc9c`,
      'padding-left': `1em`,
      'margin': `1em 3em 1em 2em`,
    },

    blockquote_p: {
      color: `#999`,
      margin: `0`,
    },

    // GFM 警告块样式 - 保持空配置
    blockquote_note: {},
    blockquote_tip: {},
    blockquote_info: {},
    blockquote_important: {},
    blockquote_warning: {},
    blockquote_caution: {},
    blockquote_title: {},
    blockquote_title_note: {},
    blockquote_title_tip: {},
    blockquote_title_info: {},
    blockquote_title_important: {},
    blockquote_title_warning: {},
    blockquote_title_caution: {},
    blockquote_p_note: {},
    blockquote_p_tip: {},
    blockquote_p_info: {},
    blockquote_p_important: {},
    blockquote_p_warning: {},
    blockquote_p_caution: {},

    code_pre: {
      'margin': `0 0 1.2em 0`,
      'font-family': `Courier, "Courier New", monospace`,
      'background': `#f8f8f8`,
      'border': `1px solid #ddd`,
      'padding': `1em 1.5em`,
      'display': `block`,
      '-webkit-overflow-scrolling': `touch`,
    },

    code: {
      'margin': `0`,
      'padding': `0`,
      'font-family': `Courier, "Courier New", monospace`,
      'font-style': `normal`,
      'font-weight': `400`,
    },

    image: {
      'border': `0`,
      'max-width': `100%`,
      'margin-bottom': `1.2em`,
    },

    ol: {
      'margin': `0`,
      'padding': `0`,
      'list-style': `none`,
      'margin-left': `1.9em`,
      'margin-bottom': `1.2em`,
    },

    ul: {
      'margin': `0`,
      'padding': `0`,
      'list-style': `none`,
      'margin-left': `1.3em`,
      'margin-bottom': `1.2em`,
    },

    hr: {
      'margin': `0`,
      'padding': `0`,
      'border': `none`,
      'border-bottom': `1px solid #cfcfcf`,
      'margin-bottom': `0.8em`,
      'height': `10px`,
    },

    // 其他必需的块级元素
    footnotes: {
      'font-size': `0.9em`,
      'color': `#888`,
      'margin-bottom': `1.2em`,
    },

    figure: {
      'margin': `0`,
      'padding': `0`,
      'margin-bottom': `1.2em`,
    },

    block_katex: {
      'margin-bottom': `1.2em`,
    },
  },

  inline: {
    listitem: {
      margin: `0`,
      padding: `0`,
    },

    codespan: {
      'font-family': `Courier, "Courier New", monospace`,
      'font-style': `normal`,
      'font-weight': `400`,
    },

    link: {
      'color': `#1abc9c`,
      'text-decoration': `none`,
      'border-bottom': `1px solid #1abc9c`,
    },

    wx_link: {
      'color': `#1abc9c`,
      'text-decoration': `none`,
      'border-bottom': `1px solid #1abc9c`,
    },

    strong: {
      'font-weight': `bold`,
      'color': `#000`,
    },

    em: {
      'font-style': `italic`,
      'color': `#000`,
      'font-weight': `inherit`,
    },

    table: {
      'border-collapse': `collapse`,
      'border-spacing': `0`,
      'margin-bottom': `1.2em`,
    },

    thead: {
      'background': `#f1f1f1`,
      'text-align': `left`,
    },

    td: {
      border: `1px solid #ddd`,
      padding: `0.5em 1em`,
      color: `#666`,
    },

    footnote: {
      'font-size': `0.9em`,
      'color': `#888`,
    },

    figcaption: {
      'font-size': `0.9em`,
      'color': `#888`,
    },

    inline_katex: {
      display: `inline`,
    },
  },
}
