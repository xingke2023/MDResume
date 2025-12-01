import type { Theme } from '@/types'

export const mwebIndigoTheme: Theme = {
  base: {

    '--md-primary-color': `#5a67d8`,
    'color': `#595959`,
    'font-family': `-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji`,
    'font-size': `14px`,
    'line-height': `1.8em`,
    'word-break': `break-all`,
    'background-image': `linear-gradient(90deg, rgba(60, 10, 30, 0.05) 3%, transparent 0), linear-gradient(1turn, rgba(60, 10, 30, 0.05) 3%, transparent 0)`,
    'background-size': `20px 20px`,
    'background-position': `50%`,
    'box-sizing': `border-box`,
  },
  block: {
    container: {
      'min-width': `200px`,
      'width': `100%`,
      'margin': `0`,
      'padding': `1em`,
    },

    h1: {
      'margin': `0`,
      'padding': `0`,
      'margin-bottom': `16px`,
      'line-height': `1.25`,
      'font-size': `1.8em`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `600`,
      'color': `#2d3748`,
      'border-color': `#5a67d8`,
      'border-style': `solid`,
      'border-top-width': `0px`,
      'border-right-width': `0px`,
      'border-bottom': `1px solid #eaecef !important`,
      'border-left-width': `0px`,
      'padding-top': `0.25rem`,
      'padding-bottom': `0.25rem`,
      'padding-left': `0rem`,
      'text-align': `left`,
    },

    h2: {
      'margin': `0`,
      'padding': `0`,
      'margin-bottom': `16px`,
      'line-height': `1.25`,
      'font-size': `1.5em`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `600`,
      'color': `#2d3748`,
      'border-color': `#5a67d8`,
      'border-style': `solid`,
      'border-top-width': `0px`,
      'border-right-width': `0px`,
      'border-bottom': `1px solid #eaecef !important`,
      'border-left-width': `6px`,
      'padding-top': `0.25rem`,
      'padding-bottom': `0.25rem`,
      'padding-left': `0.75rem`,
    },

    h3: {
      'margin': `0`,
      'padding': `0`,
      'margin-bottom': `16px`,
      'line-height': `1.25`,
      'font-size': `1.3em`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `600`,
      'color': `#2d3748`,
    },

    h4: {
      'margin': `0`,
      'padding': `0`,
      'margin-bottom': `16px`,
      'line-height': `1.25`,
      'font-size': `1.2em`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `600`,
      'color': `#2d3748`,
    },

    h5: {
      'margin': `0`,
      'padding': `0`,
      'margin-bottom': `16px`,
      'line-height': `1.25`,
      'font-size': `1.1em`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `600`,
      'color': `#2d3748`,
    },

    h6: {
      'margin': `0`,
      'padding': `0`,
      'margin-bottom': `16px`,
      'line-height': `1.25`,
      'font-size': `1em`,
      'font-family': `PingFang SC, Verdana, Helvetica Neue, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif`,
      'font-weight': `600`,
      'color': `#2d3748`,
    },

    p: {
      'margin': `0`,
      'padding': `0`,
      'margin-bottom': `1rem`,
      'color': `#595959`,
    },

    blockquote: {
      'margin': `0`,
      'padding': `0`,
      'margin-left': `0`,
      'margin-bottom': `1rem`,
      'background-color': `#ebf4ff`,
      'border-color': `#7f9cf5`,
      'color': `#667eea`,
      'padding-top': `0.5rem`,
      'padding-bottom': `0.5rem`,
      'padding-left': `1rem`,
      'padding-right': `1rem`,
      'border-left': `0.25em solid`,
    },

    blockquote_p: {
      color: `#667eea`,
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
      'margin': `0.5em 0 1rem 0`,
      'padding': `1em`,
      'display': `block`,
      'overflow-x': `auto`,
      'border-radius': `6px`,
      'background': `#272822`,
      'color': `#f8f8f2`,
      'text-shadow': `0 1px rgba(0, 0, 0, 0.3)`,
      'font-family': `Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace`,
      'font-size': `1em`,
      'line-height': `1.5`,
    },

    code: {
      'margin': `0`,
      'padding': `0`,
      'font-family': `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
      'color': `#5a67d8`,
      'background-color': `#ebf4ff`,
      'font-weight': `500`,
      'font-size': `unset`,
    },

    image: {
      'max-width': `100%`,
      'display': `block`,
      'margin': `10px auto`,
      'object-fit': `contain`,
      'border-radius': `6px`,
      'box-shadow': `2px 4px 7px #999`,
    },

    ol: {
      'margin': `0`,
      'padding': `0`,
      'list-style': `none`,
      'margin-bottom': `1rem`,
      'margin-left': `-1.3em`,
      'display': `flex`,
      'flex-direction': `column`,
      'counter-reset': `list-counter`,
    },

    ul: {
      'margin': `0`,
      'padding': `0`,
      'list-style': `none`,
      'margin-bottom': `1rem`,
      'margin-left': `-1.3em`,
      'display': `flex`,
      'flex-direction': `column`,
    },

    hr: {
      'margin': `0`,
      'padding': `0`,
      'margin-bottom': `1rem`,
    },

    // 其他必需的块级元素
    footnotes: {
      'padding-top': `0.5rem`,
      'padding-bottom': `0.5rem`,
      'margin-bottom': `1rem`,
    },

    figure: {
      'margin': `0`,
      'padding': `0`,
      'display': `flex`,
      'flex-direction': `column`,
      'justify-content': `center`,
      'align-items': `center`,
      'margin-top': `6px`,
      'margin-bottom': `6px`,
    },

    block_katex: {
      'margin-bottom': `1rem`,
    },
  },

  inline: {
    listitem: {
      'display': `flex`,
      'align-items': `flex-start`,
      'margin': `0.2em 0`,
    },

    listitem_marker: {
      'width': `2em`,
      'text-align': `right`,
      'margin-right': `0.5em`,
      'flex-shrink': `0`,
      'color': `#595959`,
    },

    listitem_content: {
      flex: `1`,
      color: `#595959`,
    },

    codespan: {
      'font-family': `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
      'color': `#5a67d8`,
      'background-color': `#ebf4ff`,
      'font-weight': `500`,
      'font-size': `unset`,
      'padding': `0.1em`,
      'border-radius': `0.3em`,
    },

    link: {
      'color': `#5a67d8`,
      'font-weight': `500`,
      'font-size': `unset`,
      'text-decoration': `none`,
      'border-bottom': `1px solid`,
      'border-color': `#667eea`,
    },

    wx_link: {
      'color': `#5a67d8`,
      'font-weight': `500`,
      'font-size': `unset`,
      'text-decoration': `none`,
      'border-bottom': `1px solid`,
      'border-color': `#667eea`,
    },

    strong: {
      'font-weight': `bold`,
      'color': `#5a67d8`,
      'background-color': `#fffacd`,
      'padding': `2px 4px`,
      'border-radius': `2px`,
    },

    em: {
      'font-style': `italic`,
      'color': `#595959`,
    },

    table: {
      'margin-bottom': `1rem`,
      'border-collapse': `collapse`,
      'border-spacing': `0`,
      'table-layout': `auto`,
      'width': `100%`,
    },

    thead: {
      'background-color': `#f8f9fa`,
    },

    td: {
      border: `1px solid #dee2e6`,
      padding: `0.5rem`,
      color: `#595959`,
    },

    footnote: {
      'font-size': `0.9em`,
      'color': `#595959`,
    },

    figcaption: {
      'font-size': `0.9em`,
      'color': `#595959`,
    },

    inline_katex: {
      display: `inline`,
    },
  },
}
