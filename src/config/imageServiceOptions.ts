export interface ImageServiceOption {
  value: string
  label: string
  endpoint: string
  models: string[]
}

export const DEFAULT_SERVICE_ENDPOINT = `https://proxy-ai.doocs.org/v1`
export const DEFAULT_SERVICE_TYPE = `default`
export const DEFAULT_SERVICE_KEY = ``

export const imageServiceOptions: ImageServiceOption[] = [
  {
    value: `default`,
    label: `内置服务`,
    endpoint: DEFAULT_SERVICE_ENDPOINT,
    models: [
      `Kwai-Kolors/Kolors`,
    ],
  },
  {
    value: `openai`,
    label: `OpenAI`,
    endpoint: `https://api.openai.com/v1`,
    models: [`gpt-image-1`, `dall-e-3`],
  },
  {
    value: `siliconflow`,
    label: `硅基流动`,
    endpoint: `https://api.siliconflow.cn/v1`,
    models: [
      `Kwai-Kolors/Kolors`,
      `Qwen/Qwen-Image`,
    ],
  },
  {
    value: `302ai`,
    label: `302.AI`,
    endpoint: `https://api.302.ai/302`,
    models: [
      `302ai-flux-1-srpo`,
      `dall-e-3`,
      `dall-e-2`,
      `gpt-image-1`,
      `ideogram-v3`,
      `midjourney-v7`,
      `stable-sd3`,
    ],
  },
]

export const DEFAULT_IMAGE_MODEL = imageServiceOptions[0].models[0]
