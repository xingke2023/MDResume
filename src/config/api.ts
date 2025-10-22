export const githubConfig = {
  username: `bucketio`,
  repoList: Array.from({ length: 20 }, (_, i) => `img${i}`),
  branch: `main`,
  accessTokenList: [
    `ghp_sqQg5y7XC7Fy8XdoocsmdVEYRiRiTZPvbwzTL4MRjQc`,
    `ghp_jB5JXzBjpGbgzdoocsmdogWfSHhfCKGVstozw1cAsPv`,
    `ghp_zvy8wkHo259g7doocsmdJnUKOQd1WO1SPzZ9G0O9cJD`,
    `ghp_DnCJc2Ms0RVZ1doocsmdiWOAN78FurfSeD1Pv2Y28pO`,
    `ghp_EsMYDv9WVjXWP5doocsmd1nnDml2DEP95rOiz44bSo0`,
    `ghp_L4isHf01nllOOdoocsmdHBGoDG6jscCA09WV44QDvlg`,
    `ghp_qWciwYXHPakAUGdoocsmdBOBZdRcV08JThKey3mBZNJ`,
    `ghp_rxkvIO08wVL2DMdoocsmd2jDEhcatp2rfVyhd3A7RiS`,
    `ghp_1RvkWKboSxr0yVdoocsmd7OtBCpecYwoV6deh3utifJ`,
    `ghp_cduanDnAug60ngdoocsmdF1uDstXUi6S9RMhY1qdada`,
    `ghp_q6mxuJIkqAcsCXdoocsmdkkjWvzGlMVRuy5zI0IWNDx`,
    `ghp_Pv4npPeJpChKFMTdoocsmdCQneopUcqJrqrjl3vrt9A`,
    `ghp_gKMCFqMaQiLTqhjdoocsmd7BJE8RyK6AdRw4b42CutS`,
    `ghp_2oShgb33qFlqBmadoocsmdludmuLYxBFY5bao1XrsVo`,
    `ghp_eYyd3kxWTZmsV8doocsmdDFbAa7AEGQTJgmOd0GUmtY`,
  ],
}

export const giteeConfig = {
  username: `filesss`,
  repoList: Array.from({ length: 20 }, (_, i) => `img${i}`),
  branch: `main`,
  accessTokenList: [
    `ed5fc9866bd6c2fdoocsmddd433f806fd2f399c`,
    `5448ffebbbf1151doocsmdc4e337cf814fc8a62`,
    `25b05efd2557ca2doocsmd75b5c0835e3395911`,
    `11628c7a5aef015doocsmd2eeff9fb9566f0458`,
    `cb2f5145ed938dedoocsmdbd063b4ed244eecf8`,
    `d8c0b57500672c1doocsmd55f48b866b5ebcd98`,
    `78c56eadb88e453doocsmd43ddd95753351771a`,
    `03e1a688003948fdoocsmda16fcf41e6f03f1f0`,
    `c49121cf4d191fbdoocsmdd6a7877ed537e474a`,
    `adfeb2fadcdc4aadoocsmdfe1ee869ac9c968ff`,
    `116c94549ca4a0ddoocsmd192653af5c0694616`,
    `ecf30ed7f2eb184doocsmd51ea4ec8300371d9e`,
    `5837cf2bd5afd93doocsmd73904bed31934949e`,
    `b5b7e1c7d57e01fdoocsmd5266f552574297d78`,
    `684d55564ffbd0bdoocsmd7d747e5cc23aed6d6`,
    `3fc04a9d272ab71doocsmd010c56cb57d88d2ba`,
  ],
}

/**
 * API 域名配置
 * 集中管理所有 API 接口域名
 */

/**
 * 主 API 服务器域名
 */
export const API_BASE_URL = `https://api.xingke888.com`

/**
 * API Key（统一管理）
 */
export const API_KEY = `0dbe66d87befa7a9d5d7c1bdbc631a9b7dc5ce88be9a20e41c26790060802647`

/**
 * API 端点
 */
export const API_ENDPOINTS = {
  // 图片相关
  IMAGE_UPLOAD: `${API_BASE_URL}/api/media/upload-image`,
  IMAGE_UPLOAD_URL: `${API_BASE_URL}/api/media/upload-image-url`,
  IMAGE_GENERATE_WECHAT: `${API_BASE_URL}/api/image/generate-wechat`,
  IMAGE_GENERATE_ARTICLE: `${API_BASE_URL}/api/image/generate-article`,
  IMAGE_OCR: `${API_BASE_URL}/api/image/ocr`,
  IMAGE_LIST: `${API_BASE_URL}/api/images/list`,

  // 提取和生成相关
  EXTRACT: `${API_BASE_URL}/extract/api/extract`,
  GENERATE_IMAGE: `${API_BASE_URL}/extract/api/generate_image`,
  QUERY_TASK: `${API_BASE_URL}/extract/api/query_task_simple`,

  // 草稿相关
  DRAFT_CREATE: `${API_BASE_URL}/api/draft/create-with-credentials`,
} as const

/**
 * 开发环境代理路径
 */
export const DEV_PROXY = {
  EXTRACT: `/api/extract`,
  IMAGE: `/api/image`,
} as const

/**
 * 根据环境获取 API URL
 * @param endpoint API端点
 * @returns 根据环境返回实际使用的URL
 */
export function getApiUrl(endpoint: string): string {
  // 开发环境使用代理
  if (import.meta.env.DEV) {
    // 判断是否需要使用代理
    if (endpoint.includes(`/extract/`)) {
      return endpoint.replace(API_BASE_URL, ``)
    }
    if (endpoint.includes(`/api/image/`)) {
      return endpoint.replace(`${API_BASE_URL}/api/image`, `/api/image`)
    }
    if (endpoint.includes(`/api/images/`)) {
      return endpoint.replace(`${API_BASE_URL}/api/images`, `/api/images`)
    }
    if (endpoint.includes(`/api/media/`)) {
      return endpoint.replace(`${API_BASE_URL}/api/media`, `/api/media`)
    }
  }
  return endpoint
}

/**
 * 第三方 API 域名
 */
export const EXTERNAL_APIS = {
  WECHAT: `https://api.weixin.qq.com`,
  TELEGRAM: `https://api.telegram.org`,
  GITHUB: `https://api.github.com`,
  CLOUDINARY: `https://api.cloudinary.com`,
  BSPAPP: `https://api.bspapp.com`,
} as const
