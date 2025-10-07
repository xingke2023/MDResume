import type { IConfigOption, Theme } from '@/types'

import { cobaltTheme } from './cobalt'
import { defaultTheme } from './default'
import { graceTheme } from './grace'
import { mwebCleanTheme } from './mweb-clean'
import { mwebIndigoTheme } from './mweb-indigo'
import { notionLikeTheme } from './notion-like'
import { rainbowTheme } from './rainbow'
import { simpleTheme } from './simple'

export const themeMap = {
  default: defaultTheme,
  grace: graceTheme,
  simple: simpleTheme,
  mwebClean: mwebCleanTheme,
  mwebIndigo: mwebIndigoTheme,
  notionLike: notionLikeTheme,
  rainbow: rainbowTheme,
  cobalt: cobaltTheme,
}

export const themeOptions: IConfigOption<keyof typeof themeMap>[] = [
  {
    label: `Indigo`,
    value: `mwebIndigo`,
    desc: `蓝紫配色网格背景`,
  },
  {
    label: `优雅`,
    value: `grace`,
    desc: ``,
  },
  {
    label: `经典`,
    value: `default`,
    desc: ``,
  },
  {
    label: `Rainbow`,
    value: `rainbow`,
    desc: `彩虹风格主题`,
  },
  {
    label: `简洁`,
    value: `simple`,
    desc: `@okooo5km`,
  },
  {
    label: `MWeb 简洁`,
    value: `mwebClean`,
    desc: `简洁阅读风格`,
  },
  {
    label: `Notion Like`,
    value: `notionLike`,
    desc: `类 Notion 简洁风格`,
  },
  {
    label: `Cobalt`,
    value: `cobalt`,
    desc: `深色 Cobalt 主题`,
  },
]

// 导出类型以便其他文件使用
export type { Theme }
