import type { Theme } from '@/types'

export const vueTheme: Theme = {
  base: {
    '--md-primary-color': `#42b983`,
    'font-family': `"Source Sans Pro", "Helvetica Neue", Arial, sans-serif`,
    'color': `#34495e`,
    '-webkit-font-smoothing': `antialiased`,
    'line-height': `1.6rem`,
    'letter-spacing': `0`,
    'background-color': `#fff`,
    'font-size': `1rem`, // 16px base
  },
  block: {
    container: {
      'min-width': `12.5rem`, // 200px converted to rem
      'max-width': `47.5rem`, // 760px converted to rem
      'margin': `0 auto`,
      'padding': `1rem`,
      'overflow': `hidden`,
    },

    h1: {
      'font-size': `2.2rem`,
      'line-height': `1.3`,
      'padding-bottom': `0.4rem`,
      'position': `relative`,
      'margin-top': `1rem`,
      'margin-bottom': `1rem`,
      'font-weight': `bold`,
      'cursor': `text`,
      'color': `#34495e`,
    },

    h2: {
      'font-size': `1.75rem`,
      'line-height': `1.225`,
      'margin': `2.1875rem 0 0.9375rem`, // 35px 0 15px converted to rem
      'padding-bottom': `0.5rem`,
      'border-bottom': `0.0625rem solid #ddd`, // 1px converted to rem
      'position': `relative`,
      'font-weight': `bold`,
      'cursor': `text`,
      'color': `#34495e`,
    },

    h3: {
      'font-size': `1.4rem`,
      'line-height': `1.43`,
      'margin': `1.25rem 0 0.4375rem`, // 20px 0 7px converted to rem
      'position': `relative`,
      'font-weight': `bold`,
      'cursor': `text`,
      'color': `#34495e`,
    },

    h4: {
      'font-size': `1.2rem`,
      'position': `relative`,
      'margin-top': `1rem`,
      'margin-bottom': `1rem`,
      'font-weight': `bold`,
      'cursor': `text`,
      'color': `#34495e`,
    },

    h5: {
      'font-size': `1rem`,
      'position': `relative`,
      'margin-top': `1rem`,
      'margin-bottom': `1rem`,
      'font-weight': `bold`,
      'cursor': `text`,
      'color': `#34495e`,
    },

    h6: {
      'font-size': `1rem`,
      'color': `#777`,
      'position': `relative`,
      'margin-top': `1rem`,
      'margin-bottom': `1rem`,
      'font-weight': `bold`,
      'cursor': `text`,
    },

    p: {
      margin: `0.8rem 0`,
      color: `#34495e`,
    },

    blockquote: {
      'border-left': `0.25rem solid #42b983`, // 4px converted to rem
      'padding': `0.625rem 0.9375rem`, // 10px 15px converted to rem
      'color': `#777`,
      'background-color': `rgba(66, 185, 131, 0.1)`,
      'margin': `0.8rem 0`,
    },

    blockquote_p: {
      color: `#777`,
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
      'border-radius': `0.125rem`, // 2px converted to rem
      'font-family': `"Roboto Mono", "Source Sans Pro", Monaco, courier, monospace`,
      'font-size': `0.92rem`,
      'color': `#e96900`,
      'overflow-x': `auto`,
      'background-color': `#f8f8f8`,
      'padding': `0.7rem 1rem`,
      'margin': `0.8rem 0`,
    },

    code: {
      'border-radius': `0.125rem`, // 2px converted to rem
      'font-family': `"Roboto Mono", "Source Sans Pro", Monaco, courier, monospace`,
      'font-size': `0.92rem`,
      'color': `#e96900`,
      'background-color': `#f8f8f8`,
      'margin': `0 0.125rem`, // 2px converted to rem
      'padding': `0.125rem 0.25rem`, // 2px 4px converted to rem
    },

    image: {
      'max-width': `100%`,
      'box-sizing': `border-box`,
      'display': `block`,
      'margin': `1rem auto`,
    },

    ol: {
      'list-style': `none`,
      'display': `flex`,
      'flex-direction': `column`,
      'counter-reset': `list-counter`,
      'margin': `0.8rem 0`,
      'margin-left': `-1.7em`,
    },

    ul: {
      'list-style': `none`,
      'display': `flex`,
      'flex-direction': `column`,
      'margin': `0.8rem 0`,
      'margin-left': `-1.7em`,
    },

    hr: {
      'height': `0.125rem`, // 2px converted to rem
      'padding': `0`,
      'margin': `1rem 0`,
      'background-color': `#e7e7e7`,
      'border': `0 none`,
      'overflow': `hidden`,
      'box-sizing': `content-box`,
    },

    // 其他必需的块级元素
    footnotes: {
      'font-size': `0.9rem`,
      'color': `#777`,
      'margin-bottom': `1rem`,
    },

    figure: {
      'margin': `1rem 0`,
      'padding': `0`,
      'display': `flex`,
      'flex-direction': `column`,
      'justify-content': `center`,
      'align-items': `center`,
    },

    block_katex: {
      'margin-bottom': `1rem`,
    },
  },

  inline: {
    listitem: {
      'margin': `0`,
      'padding': `0`,
      'list-style-type': `none`,
      'display': `flex`,
      'align-items': `flex-start`,
    },

    listitem_marker: {
      'width': `2em`,
      'text-align': `right`,
      'margin-right': `0.5em`,
      'flex-shrink': `0`,
    },

    listitem_content: {
      flex: `1`,
    },

    codespan: {
      'border-radius': `0.125rem`, // 2px converted to rem
      'font-family': `"Roboto Mono", "Source Sans Pro", Monaco, courier, monospace`,
      'font-size': `0.92rem`,
      'color': `#e96900`,
      'background-color': `#f8f8f8`,
      'margin': `0 0.125rem`, // 2px converted to rem
      'padding': `0.125rem 0.25rem`, // 2px 4px converted to rem
    },

    link: {
      'color': `#42b983`,
      'font-weight': `600`,
      'padding': `0 0.125rem`, // 2px converted to rem
      'text-decoration': `none`,
    },

    wx_link: {
      'color': `#42b983`,
      'font-weight': `600`,
      'padding': `0 0.125rem`, // 2px converted to rem
      'text-decoration': `none`,
    },

    strong: {
      'font-weight': `bold`,
      'color': `#34495e`,
    },

    em: {
      'font-style': `italic`,
      'color': `#34495e`,
    },

    table: {
      'padding': `0`,
      'word-break': `initial`,
      'border-collapse': `collapse`,
      'margin': `0.8rem 0`,
      'width': `100%`,
    },

    thead: {
      'background-color': `#fafafa`,
      'font-weight': `bold`,
    },

    td: {
      'border': `0.0625rem solid #dfe2e5`, // 1px converted to rem
      'text-align': `left`,
      'margin': `0`,
      'padding': `0.375rem 0.8125rem`, // 6px 13px converted to rem
    },

    footnote: {
      'font-size': `0.9rem`,
      'color': `#777`,
    },

    figcaption: {
      'font-size': `0.9rem`,
      'color': `#777`,
    },

    inline_katex: {
      display: `inline`,
    },
  },
}
