import type { Theme } from '@/types'

export const mdmdtLightTheme: Theme = {
  base: {
    '--md-primary-color': `#3e69d7`,
    'color': `#000`,
    'font-family': `"PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", Arial, "Helvetica Neue", Helvetica, sans-serif`,
    'line-height': `1.6`,
    'letter-spacing': `0.6px`,
    'background-color': `rgb(250, 250, 252)`,
    '-webkit-font-smoothing': `antialiased`,
    'scroll-behavior': `smooth`,
  },
  block: {
    container: {
      'width': `90%`,
      'max-width': `1424px`,
      'min-width': `300px`,
      'margin': `0 auto`,
      'padding': `2em`,
      'overflow': `auto`,
    },

    h1: {
      'font-size': `2em`,
      'line-height': `1.5`,
      'margin': `2em 0 1em`,
      'color': `#070909`,
      'letter-spacing': `2px`,
      'font-weight': `700`,
      'border-bottom': `1px solid #d2d2d2`,
      'padding-bottom': `0.3em`,
      'text-align': `center`,
    },

    h2: {
      'font-size': `1.75em`,
      'line-height': `1.5`,
      'margin': `2em 0 1em`,
      'color': `#070909`,
      'letter-spacing': `2px`,
      'font-weight': `700`,
    },

    h3: {
      'font-size': `1.5em`,
      'line-height': `1.5`,
      'margin': `2em 0 1em`,
      'color': `#070909`,
      'letter-spacing': `2px`,
      'font-weight': `700`,
    },

    h4: {
      'font-size': `1.25em`,
      'line-height': `1.5`,
      'margin': `2em 0 1em`,
      'color': `#070909`,
      'letter-spacing': `2px`,
      'font-weight': `700`,
    },

    h5: {
      'font-size': `1.125em`,
      'line-height': `1.5`,
      'margin': `2em 0 1em`,
      'color': `#070909`,
      'letter-spacing': `2px`,
      'font-weight': `700`,
    },

    h6: {
      'font-size': `1em`,
      'line-height': `1.5`,
      'margin': `2em 0 1em`,
      'color': `#070909`,
      'letter-spacing': `2px`,
      'font-weight': `700`,
    },

    p: {
      'margin-top': `1em`,
      'margin-bottom': `0`,
      'white-space': `pre-wrap`,
      'color': `#000`,
    },

    blockquote: {
      'margin-top': `1em`,
      'margin-bottom': `1em`,
      'padding': `1em`,
      'background': `rgba(62, 105, 215, 0.06)`,
      'box-sizing': `border-box`,
      'border-radius': `8px`,
      'border-left': `4px solid #3e69d7`,
      'border-right': `0.1px solid transparent`,
      'border-bottom': `0.1px solid transparent`,
      'border-top': `0.1px solid transparent`,
    },

    blockquote_p: {
      color: `#000`,
      margin: `0`,
    },

    // GFM 警告块样式
    blockquote_note: {
      'border-left-color': `#3e69d7`,
      'background': `rgba(62, 105, 215, 0.06)`,
      'color': `#3e69d7`,
    },
    blockquote_tip: {
      'border-left-color': `#03b736`,
      'background': `rgba(3, 183, 54, 0.06)`,
      'color': `#03b736`,
    },
    blockquote_info: {
      'border-left-color': `#3e69d7`,
      'background': `rgba(62, 105, 215, 0.06)`,
      'color': `#3e69d7`,
    },
    blockquote_important: {
      'border-left-color': `#8250df`,
      'background': `rgba(130, 80, 223, 0.06)`,
      'color': `#8250df`,
    },
    blockquote_warning: {
      'border-left-color': `#e30f2e`,
      'background': `rgba(227, 15, 46, 0.06)`,
      'color': `#e30f2e`,
    },
    blockquote_caution: {
      'border-left-color': `#f59102`,
      'background': `rgba(245, 145, 2, 0.06)`,
      'color': `#f59102`,
    },
    blockquote_title: {},
    blockquote_title_note: {
      color: `#3e69d7`,
    },
    blockquote_title_tip: {
      color: `#03b736`,
    },
    blockquote_title_info: {
      color: `#3e69d7`,
    },
    blockquote_title_important: {
      color: `#8250df`,
    },
    blockquote_title_warning: {
      color: `#e30f2e`,
    },
    blockquote_title_caution: {
      color: `#f59102`,
    },
    blockquote_p_note: {},
    blockquote_p_tip: {},
    blockquote_p_info: {},
    blockquote_p_important: {},
    blockquote_p_warning: {},
    blockquote_p_caution: {},

    code_pre: {
      'margin-top': `1em`,
      'margin-bottom': `1em`,
      'box-sizing': `border-box`,
      'background': `rgb(236, 236, 238)`,
      'border-radius': `8px`,
      'font-size': `0.875em`,
      'color': `#2f479f`,
      'padding': `1em`,
      'font-family': `"JetBrains Mono", "Source Code Pro", "Fira Code", Consolas, Inconsolata, "Cascadia Code", Monaco, "Ubuntu Mono", monospace`,
    },

    code: {
      'border-radius': `4px`,
      'background': `rgba(62, 105, 215, 0.15)`,
      'padding': `0.2em 0.4em`,
      'color': `#2f479f`,
      'font-size': `0.875em`,
      'box-decoration-break': `clone`,
      'font-family': `"JetBrains Mono", "Source Code Pro", "Fira Code", Consolas, Inconsolata, "Cascadia Code", Monaco, "Ubuntu Mono", monospace`,
    },

    image: {
      'margin': `1em auto`,
      'border-radius': `8px`,
      'border': `none`,
      'max-width': `100%`,
      'display': `block`,
    },

    ol: {
      'list-style': `none`,
      'padding-left': `40px`,
      'margin-top': `0`,
      'margin-bottom': `0`,
      'margin-left': `0`,
    },

    ul: {
      'list-style': `none`,
      'padding-left': `36px`,
      'margin-top': `0`,
      'margin-bottom': `0`,
      'margin-left': `0`,
    },

    hr: {
      'height': `1px`,
      'box-sizing': `border-box`,
      'background': `#d2d2d2`,
      'border': `none`,
      'margin': `1em 0`,
    },

    // 其他必需的块级元素
    footnotes: {
      'font-size': `14px`,
      'color': `#666`,
      'margin-bottom': `1rem`,
    },

    figure: {
      'width': `100%`,
      'margin-bottom': `0`,
      'border-radius': `8px`,
      'padding': `0`,
      'margin-top': `16px`,
    },

    block_katex: {
      'margin-bottom': `1rem`,
    },
  },

  inline: {
    listitem: {
      'margin-top': `6px`,
      'margin': `0`,
      'padding': `0`,
    },

    codespan: {
      'font-family': `"JetBrains Mono", "Source Code Pro", "Fira Code", Consolas, Inconsolata, "Cascadia Code", Monaco, "Ubuntu Mono", monospace`,
      'border-radius': `4px`,
      'background': `rgba(62, 105, 215, 0.15)`,
      'padding': `3px 5px`,
      'color': `#2f479f`,
      'font-size': `14px`,
      'box-decoration-break': `clone`,
    },

    link: {
      'position': `relative`,
      'font-weight': `500`,
      'text-decoration': `none`,
      'color': `#3e69d7`,
      'font-size': `16px`,
      'text-underline-offset': `4px`,
    },

    wx_link: {
      'position': `relative`,
      'font-weight': `500`,
      'text-decoration': `none`,
      'color': `#3e69d7`,
      'font-size': `16px`,
      'text-underline-offset': `4px`,
    },

    strong: {
      'font-weight': `800`,
      'color': `#070909`,
    },

    em: {
      'font-weight': `400`,
      'font-style': `italic`,
      'color': `#000`,
    },

    table: {
      'width': `100%`,
      'margin-bottom': `0`,
      'border-radius': `8px`,
      'padding': `0`,
      'border-collapse': `separate`,
      'border-spacing': `0`,
      'margin-top': `0`,
      'border': `1px solid #d2d2d2`,
      'overflow': `hidden`,
    },

    thead: {
      'background': `rgb(236, 236, 238)`,
      'font-weight': `bold`,
    },

    td: {
      'padding': `10px`,
      'white-space': `pre-wrap`,
      'border-left': `1px solid #d2d2d2`,
      'margin': `0`,
    },

    footnote: {
      'font-size': `14px`,
      'color': `#666`,
    },

    figcaption: {
      'font-size': `14px`,
      'color': `#666`,
    },

    inline_katex: {
      display: `inline`,
    },
  },
}
