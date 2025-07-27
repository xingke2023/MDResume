import type { Theme } from '@/types'

export const rainbowTheme: Theme = {
  base: {
    '--md-primary-color': `rgb(255, 191, 191)`,
    'font-family': `"Noto Sans SC Medium", "Noto Sans SC", sans-serif`,
    'color': `#000`,
    'background-color': `#fff`,
  },
  block: {
    container: {
      'max-width': `60rem`,
      'padding-left': `2rem`,
      'padding-right': `2rem`,
      'margin': `0 auto`,
    },

    h1: {
      'font-size': `2.2rem`,
      'text-align': `center`,
      'text-shadow': `0.15rem 0.15rem 0.3rem rgb(187, 187, 187)`,
      'margin-top': `2rem`,
      'margin-bottom': `1.5rem`,
      'font-weight': `500`,
    },

    h2: {
      'font-size': `1.8rem`,
      'margin-top': `1.8rem`,
      'margin-left': `-1.5rem`,
      'margin-right': `-1.5rem`,
      'margin-bottom': `1.5rem`,
      'background-color': `rgb(255, 232, 232)`,
      'padding-left': `1rem`,
      'padding-right': `1rem`,
      'padding-top': `0.5rem`,
      'padding-bottom': `0.5rem`,
      'border-left': `0.5rem solid rgb(255, 191, 191)`,
      'border-radius': `0.4rem`,
      'font-weight': `500`,
    },

    h3: {
      'font-size': `1.6rem`,
      'text-decoration': `underline double rgb(255, 191, 191) 0.15rem`,
      'margin-top': `1.6rem`,
      'margin-bottom': `1rem`,
      'font-weight': `500`,
    },

    h4: {
      'font-size': `1.3rem`,
      'text-decoration': `underline dotted rgb(255, 191, 191) 0.2rem`,
      'margin-top': `1.3rem`,
      'margin-bottom': `1rem`,
      'font-weight': `500`,
    },

    h5: {
      'font-size': `1.2rem`,
      'margin-top': `1.2rem`,
      'margin-bottom': `1rem`,
      'font-weight': `500`,
    },

    h6: {
      'font-size': `1.1rem`,
      'margin-top': `1.1rem`,
      'margin-bottom': `1rem`,
      'font-weight': `500`,
    },

    p: {
      'font-size': `1rem`,
      'line-height': `1.6rem`,
      'margin-top': `1rem`,
      'margin-bottom': `1rem`,
    },

    blockquote: {
      'color': `rgb(102, 102, 102)`,
      'border-left': `0.25rem solid rgb(169, 202, 255)`,
      'padding': `0.5rem 1rem 0.6rem 1rem`,
      'margin': `1rem 0`,
      'position': `relative`,
    },

    blockquote_p: {
      color: `rgb(102, 102, 102)`,
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
      'font-family': `"Source Code Pro Regular", "Source Code Pro", monospace`,
      'font-size': `1rem`,
      'padding': `0.6rem`,
      'background-color': `rgb(247, 247, 247)`,
      'border-radius': `0.4rem`,
      'box-shadow': `0.15rem 0.15rem 0.5rem rgb(150, 150, 150)`,
      'margin': `1rem 0`,
    },

    code: {
      'font-family': `"Source Code Pro Regular", "Source Code Pro", monospace`,
      'font-size': `1rem`,
      'padding': `0.6rem`,
      'background-color': `rgb(247, 247, 247)`,
      'border-radius': `0.4rem`,
      'color': `rgb(134, 134, 134)`,
    },

    image: {
      'display': `block`,
      'margin': `1rem auto`,
      'border': `0`,
      'border-radius': `0.3125rem`,
      'box-shadow': `0.15rem 0.15rem 0.5rem rgb(150, 150, 150)`,
      'max-width': `100%`,
    },

    ol: {
      'list-style': `none`,
      'padding-left': `2rem`,
      'margin': `1rem 0`,
    },

    ul: {
      'list-style': `none`,
      'padding-left': `2rem`,
      'margin': `1rem 0`,
    },

    hr: {
      'margin-top': `2rem`,
      'margin-bottom': `2rem`,
      'background-color': `rgb(226, 226, 226)`,
      'height': `0.13rem`,
      'border': `0`,
    },

    // 其他必需的块级元素
    footnotes: {
      'font-size': `0.9rem`,
      'color': `rgb(102, 102, 102)`,
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
      'font-size': `1.1rem`,
      'margin-bottom': `1rem`,
    },
  },

  inline: {
    listitem: {
      'text-indent': `-1em`,
      'display': `block`,
      'margin': `0.2em 0`,
      'padding': `0`,
      'color': `#000`,
    },

    codespan: {
      'font-family': `"Source Code Pro Regular", "Source Code Pro", monospace`,
      'margin-left': `0.25rem`,
      'margin-right': `0.25rem`,
      'padding': `0.05rem 0.3rem`,
      'background-color': `rgb(247, 247, 247)`,
      'border-radius': `0.4rem`,
      'box-shadow': `0.13rem 0.13rem 0.26rem rgb(197, 197, 197)`,
      'font-size': `0.9rem`,
    },

    link: {
      'color': `rgb(31, 117, 255)`,
      'text-decoration': `none`,
    },

    wx_link: {
      'color': `rgb(31, 117, 255)`,
      'text-decoration': `none`,
    },

    strong: {
      'font-weight': `bold`,
      'color': `#000`,
    },

    em: {
      'font-style': `italic`,
      'color': `#000`,
    },

    table: {
      'border-collapse': `collapse`,
      'border': `0.25rem solid rgb(255, 235, 211)`,
      'margin': `1rem 0`,
      'width': `100%`,
    },

    thead: {
      'background-color': `rgb(255, 243, 228)`,
    },

    td: {
      'text-align': `center`,
      'border': `0.13rem dashed rgb(255, 235, 211)`,
      'padding': `0.5rem`,
    },

    footnote: {
      'font-size': `0.9rem`,
      'color': `rgb(102, 102, 102)`,
    },

    figcaption: {
      'font-size': `0.9rem`,
      'color': `rgb(102, 102, 102)`,
    },

    inline_katex: {
      'display': `inline`,
      'font-size': `1.1rem`,
    },
  },
}
