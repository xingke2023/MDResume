import type { Theme } from '@/types'

export const notionLikeTheme: Theme = {
  base: {
    '--md-primary-color': `#37352f`,
    'color': `#37352f`,
    'font-family': `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"`,
    'font-size': `16px`,
    'line-height': `1.6`,
    '-webkit-font-smoothing': `antialiased`,
    'background-color': `#ffffff`,
  },
  block: {
    container: {
      'width': `100%`,
      'margin': `0`,
      'padding': `5px`,
      'padding-bottom': `100px`,
    },

    h1: {
      'font-size': `2.2em`,
      'line-height': `1.3`,
      'color': `#37352f`,
      'font-weight': `700`,
      'margin-top': `2rem`,
      'margin-bottom': `1rem`,
      'padding-bottom': `0.3em`,
      'text-align': `left`,
    },

    h2: {
      'font-size': `1.75em`,
      'line-height': `1.225`,
      'color': `#37352f`,
      'font-weight': `700`,
      'margin-top': `2rem`,
      'margin-bottom': `1rem`,
      'padding-bottom': `0.3em`,
    },

    h3: {
      'font-size': `1.4em`,
      'line-height': `1.43`,
      'color': `#37352f`,
      'font-weight': `700`,
      'margin-top': `2rem`,
      'margin-bottom': `1rem`,
    },

    h4: {
      'font-size': `1.2em`,
      'color': `#37352f`,
      'font-weight': `700`,
      'margin-top': `2rem`,
      'margin-bottom': `1rem`,
    },

    h5: {
      'font-size': `1em`,
      'color': `#37352f`,
      'font-weight': `700`,
      'margin-top': `2rem`,
      'margin-bottom': `1rem`,
    },

    h6: {
      'font-size': `1em`,
      'color': `#37352f`,
      'font-weight': `700`,
      'margin-top': `2rem`,
      'margin-bottom': `1rem`,
    },

    p: {
      margin: `0.8em 0`,
      color: `#37352f`,
    },

    blockquote: {
      'color': `#37352f`,
      'margin-left': `1.75px`,
      'margin-right': `0px`,
      'border-left': `4px solid #37352f`,
      'padding': `10px 14px 7px 22px`,
      'background-color': `#f7f7f7`,
      'margin': `0.8em 0`,
    },

    blockquote_p: {
      color: `#37352f`,
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
      'color': `#37352f`,
      'background-color': `#f7f6f3`,
      'border-radius': `4px`,
      'padding': `8px`,
      'margin-bottom': `15px`,
      'margin-top': `15px`,
      'font-family': `'SF Mono Medium', 'Fira Code', 'Cousine', 'Consolas', monospace`,
      'font-size': `0.975em`,
      'font-weight': `500`,
    },

    code: {
      'color': `#37352f`,
      'background-color': `#f7f6f3`,
      'border-radius': `4px`,
      'padding': `2px 4px 0px 4px`,
      'font-size': `0.975em`,
      'font-weight': `500`,
      'font-family': `'SF Mono Medium', 'Fira Code', 'Cousine', 'Consolas', monospace`,
    },

    image: {
      'max-width': `100%`,
      'display': `block`,
      'margin': `10px auto`,
      'object-fit': `contain`,
    },

    ol: {
      'list-style': `none`,
      'display': `flex`,
      'flex-direction': `column`,
      'counter-reset': `list-counter`,
      'margin': `0.8em 0`,
      'margin-left': `-1.7em`,
    },

    ul: {
      'list-style': `none`,
      'display': `flex`,
      'flex-direction': `column`,
      'margin': `0.8em 0`,
      'margin-left': `-1.7em`,
    },

    hr: {
      'background-color': `#37352f`,
      'height': `1.5px`,
      'border': `none`,
      'margin': `0.8em 0`,
    },

    // 其他必需的块级元素
    footnotes: {
      'font-size': `0.9em`,
      'color': `#73726e`,
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
      'margin': `0.2em 8px`,
      'padding': `0`,
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
      'font-family': `'SF Mono Medium', 'Fira Code', 'Cousine', 'Consolas', monospace`,
      'color': `#37352f`,
      'background-color': `#f7f6f3`,
      'border-radius': `4px`,
      'padding': `2px 4px 0px 4px`,
      'font-size': `0.975em`,
      'font-weight': `500`,
    },

    link: {
      'color': `#37352f`,
      'text-decoration': `none`,
      'border-bottom': `0.05em solid`,
      'border-color': `#37352f`,
      'transition': `all .1s ease-in`,
    },

    wx_link: {
      'color': `#37352f`,
      'text-decoration': `none`,
      'border-bottom': `0.05em solid`,
      'border-color': `#37352f`,
      'transition': `all .1s ease-in`,
    },

    strong: {
      'font-weight': `700`,
      'color': `#4f3b2a`,
      'background-color': `#feecc8`,
      'padding': `2px 0px`,
      'border-radius': `4px`,
      'margin': `0 2px`,
    },

    em: {
      'font-style': `italic`,
      'color': `#37352f`,
    },

    table: {
      'margin': `0.8em 0`,
      'border-collapse': `collapse`,
      'border-spacing': `0`,
      'padding': `0`,
      'word-break': `initial`,
    },

    thead: {
      'background-color': `#f7f7f7`,
      'font-weight': `bold`,
    },

    td: {
      border: `1px solid #e9e9e7`,
      padding: `6px 13px`,
      margin: `0`,
    },

    footnote: {
      'font-size': `0.9em`,
      'color': `#73726e`,
    },

    figcaption: {
      'font-size': `0.9em`,
      'color': `#73726e`,
    },

    inline_katex: {
      display: `inline`,
    },
  },
}
