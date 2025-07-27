import type { Theme } from '@/types'

export const greenInteractiveTheme: Theme = {
  base: {
    '--md-primary-color': `#2f845e`,
    'font-family': `"Fira Code", Consolas, "Lucida Console", "Courier", monospace, "Helvetica Neue", Helvetica, Arial, sans-serif`,
    'color': `#282c34`,
    'background-color': `#fefefe`,
    'text-align': `justify`,
    'line-height': `1.9rem`,
  },
  block: {
    container: {
      'max-width': `75rem`, // 1200px converted to rem
      'margin': `0 auto`,
      'padding-bottom': `7.5rem`,
      'padding-left': `2rem`,
      'padding-right': `2rem`,
    },

    h1: {
      'font-size': `2rem`,
      'text-align': `center`,
      'margin-top': `1.5rem`,
      'margin-bottom': `1rem`,
      'font-style': `normal`,
      'position': `relative`,
      'overflow': `hidden`,
      'transition': `transform 0.4s ease`,
    },

    h2: {
      'font-size': `1.8rem`,
      'text-align': `center`,
      'margin-top': `1.5rem`,
      'margin-bottom': `0rem`,
      'position': `relative`,
      'padding-bottom': `0rem`,
      'font-weight': `bold`,
      'font-style': `normal`,
    },

    h3: {
      'font-size': `1.6rem`,
      'position': `relative`,
      'margin-top': `1rem`,
      'margin-bottom': `0.5rem`,
      'font-style': `normal`,
      'transition': `transform 0.3s ease`,
    },

    h4: {
      'font-size': `1.4rem`,
      'position': `relative`,
      'margin-top': `1rem`,
      'margin-bottom': `0.5rem`,
      'transition': `transform 0.3s ease`,
    },

    h5: {
      'font-size': `1.2rem`,
      'position': `relative`,
      'margin-top': `1rem`,
      'margin-bottom': `0.5rem`,
      'transition': `transform 0.3s ease`,
    },

    h6: {
      'font-size': `1rem`,
      'position': `relative`,
      'margin-top': `1rem`,
      'margin-bottom': `0.5rem`,
      'transition': `transform 0.3s ease`,
    },

    p: {
      'font-size': `1rem`,
      'padding': `0 0.3rem`,
      'transition': `all 0.25s ease`,
      'word-spacing': `0.1rem`,
      'line-height': `1.9rem`,
      'margin': `0.1875rem`, // 3px converted to rem
    },

    blockquote: {
      'padding': `0.5rem 1rem`,
      'border-left': `0.5rem solid #54a12b`,
      'background-color': `rgba(238, 244, 232, 0.53)`,
      'border-radius': `0.4375rem`, // 7px converted to rem
      'transition': `box-shadow 0.3s ease, border-radius 0.3s ease, border-left 0.3s ease`,
      'margin': `1rem 0`,
    },

    blockquote_p: {
      color: `#282c34`,
      margin: `0.1rem 0`,
    },

    // GFM 警告块样式
    blockquote_note: {
      'padding': `0.5rem 1rem`,
      'border-left': `0.5rem solid #0969DA`,
      'background-color': `rgba(229, 235, 241, 0.47)`,
      'border-radius': `0.4375rem`,
      'transition': `box-shadow 0.3s ease, border-radius 0.3s ease, border-left 0.3s ease`,
    },
    blockquote_tip: {
      'padding': `0.5rem 1rem`,
      'border-left': `0.5rem solid #1F883D`,
      'background-color': `rgba(232, 244, 235, 0.56)`,
      'border-radius': `0.4375rem`,
      'transition': `box-shadow 0.3s ease, border-radius 0.3s ease, border-left 0.3s ease`,
    },
    blockquote_info: {
      'padding': `0.5rem 1rem`,
      'border-left': `0.5rem solid #0969DA`,
      'background-color': `rgba(229, 235, 241, 0.47)`,
      'border-radius': `0.4375rem`,
      'transition': `box-shadow 0.3s ease, border-radius 0.3s ease, border-left 0.3s ease`,
    },
    blockquote_important: {
      'padding': `0.5rem 1rem`,
      'border-left': `0.5rem solid #8250DF`,
      'background-color': `rgba(234, 230, 242, 0.53)`,
      'border-radius': `0.4375rem`,
      'transition': `box-shadow 0.3s ease, border-radius 0.3s ease, border-left 0.3s ease`,
    },
    blockquote_warning: {
      'padding': `0.5rem 1rem`,
      'border-left': `0.5rem solid #9A6700`,
      'background-color': `rgba(244, 241, 233, 0.49)`,
      'border-radius': `0.4375rem`,
      'transition': `box-shadow 0.3s ease, border-radius 0.3s ease, border-left 0.3s ease`,
    },
    blockquote_caution: {
      'padding': `0.5rem 1rem`,
      'border-left': `0.5rem solid #CF222E`,
      'background-color': `rgba(245, 236, 236, 0.53)`,
      'border-radius': `0.4375rem`,
      'transition': `box-shadow 0.3s ease, border-radius 0.3s ease, border-left 0.3s ease`,
    },
    blockquote_title: {},
    blockquote_title_note: {
      color: `#0969DA`,
    },
    blockquote_title_tip: {
      color: `#1F883D`,
    },
    blockquote_title_info: {
      color: `#0969DA`,
    },
    blockquote_title_important: {
      color: `#8250DF`,
    },
    blockquote_title_warning: {
      color: `#9A6700`,
    },
    blockquote_title_caution: {
      color: `#CF222E`,
    },
    blockquote_p_note: {},
    blockquote_p_tip: {},
    blockquote_p_info: {},
    blockquote_p_important: {},
    blockquote_p_warning: {},
    blockquote_p_caution: {},

    code_pre: {
      'font-family': `"Fira Code", Consolas, "Lucida Console", "Courier", monospace, "Helvetica Neue", Helvetica, Arial, sans-serif`,
      'color': `#2f4f4f`,
      'background-color': `#ffffff`,
      'padding': `1.0625rem`, // 17px converted to rem
      'padding-top': `2rem`, // 32px converted to rem
      'border-radius': `0.625rem`, // 10px converted to rem
      'box-shadow': `0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.15)`,
      'transition': `transform 0.3s ease, box-shadow 0.3s ease`,
      'position': `relative`,
      'margin': `1rem 0`,
    },

    code: {
      'font-family': `"Fira Code", Consolas, "Lucida Console", "Courier", monospace, "Helvetica Neue", Helvetica, Arial, sans-serif`,
      'background-color': `rgba(221, 235, 213, 0.5)`,
      'color': `#359d09`,
      'font-size': `1rem`,
      'font-weight': `550`,
      'margin': `0 0.125rem`,
      'padding': `0.1875rem 0.1875rem 0.0625rem`,
      'border-radius': `0.4375rem`,
      'transition': `all 0.3s ease`,
    },

    image: {
      'border-radius': `0.625rem`,
      'max-width': `100%`,
      'display': `block`,
      'margin': `1em auto`,
      'transition': `transform 0.15s ease, border-radius 0.15s ease`,
    },

    ol: {
      'list-style': `none`,
      'margin': `0`,
      'padding-left': `2rem`,
    },

    ul: {
      'list-style': `none`,
      'margin': `0`,
      'padding-left': `2rem`,
    },

    hr: {
      'position': `relative`,
      'margin-top': `2rem`,
      'margin-bottom': `2rem`,
      'border': `none`,
      'border-top': `0.125rem solid transparent`,
      'background-image': `linear-gradient(90deg, #5ea67c, #2f845e, #5ea67c)`,
      'height': `0.09375rem`, // 1.5px converted to rem
      'overflow': `visible`,
      'color': `#abb2bf`,
      'opacity': `0.8`,
      'border-radius': `0.3125rem`,
      'box-shadow': `0 0.25rem 0.375rem rgba(0, 0, 0, 0.15)`,
      'transition': `transform 0.3s ease, background-position 0.3s ease, height 0.3s ease`,
      'background-size': `200% 100%`,
      'background-position': `0 0`,
    },

    // 其他必需的块级元素
    footnotes: {
      'font-size': `1rem`,
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
      'padding-left': `0.3rem`,
    },

    codespan: {
      'font-family': `"Fira Code", Consolas, "Lucida Console", "Courier", monospace, "Helvetica Neue", Helvetica, Arial, sans-serif`,
      'background-color': `rgba(221, 235, 213, 0.5)`,
      'color': `#359d09`,
      'font-size': `1rem`,
      'font-weight': `550`,
      'margin': `0 0.125rem`,
      'padding': `0.1875rem 0.1875rem 0.0625rem`,
      'border-radius': `0.4375rem`,
      'transition': `all 0.3s ease`,
    },

    link: {
      'background-color': `inherit`,
      'color': `#0c8f94`,
      'text-decoration': `none`,
      'transition': `color 0.3s ease`,
    },

    wx_link: {
      'background-color': `inherit`,
      'color': `#0c8f94`,
      'text-decoration': `none`,
      'transition': `color 0.3s ease`,
    },

    strong: {
      'font-weight': `bold`,
      'color': `#06621e`,
      'font-size': `1.05rem`,
      'transition': `font-size 0.3s ease, padding 0.3s ease`,
      'display': `inline-block`,
      'margin': `0 0.125rem`,
    },

    em: {
      'background-color': `inherit`,
      'color': `#000000`,
      'transition': `all 0.3s ease`,
      'padding-left': `0.0625rem`,
      'padding-right': `0.0625rem`,
      'font-style': `italic`,
    },

    table: {
      'border': `0.0625rem solid rgba(3, 54, 34, 0.13)`,
      'border-radius': `0.625rem`,
      'border-collapse': `separate`,
      'overflow': `hidden`,
      'margin': `1rem 0`,
      'width': `100%`,
    },

    thead: {
      'background-color': `#eff5f2`,
      'color': `#06621e`,
    },

    td: {
      'padding': `0.625rem 1rem`,
      'border-top': `0.0625rem solid rgba(3, 54, 34, 0.13)`,
      'border': `0.03125rem solid rgba(3, 54, 34, 0.13)`,
      'transition': `all 0.3s ease`,
    },

    footnote: {
      'font-size': `1rem`,
      'color': `#282c34`,
    },

    figcaption: {
      'font-size': `0.9rem`,
      'color': `#282c34`,
    },

    inline_katex: {
      display: `inline`,
    },
  },
}
