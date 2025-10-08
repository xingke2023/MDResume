import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { customRef, ref, watch } from 'vue'
import { serviceOptions } from '@/config/ai-services'
import {
  DEFAULT_DEEPSEEK_KEY,
  DEFAULT_SERVICE_KEY,
  DEFAULT_SERVICE_MAX_TOKEN,
  DEFAULT_SERVICE_TEMPERATURE,
  DEFAULT_SERVICE_TYPE,
} from '@/constants/AIConfig'

export default defineStore(`AIConfig`, () => {
  /* ————— 服务类型 ————— */
  const type = useStorage<string>(`openai_type`, DEFAULT_SERVICE_TYPE)

  /* ————— 与 service 强相关的字段 ————— */
  const model = ref<string>(``) // 由 watch(type) 初始化

  /* ————— endpoint：按 service 前缀持久化 ————— */
  const endpoint = customRef<string>((track, trigger) => ({
    get() {
      track()
      const storedEndpoint = localStorage.getItem(`openai_endpoint_${type.value}`)
      if (storedEndpoint) {
        return storedEndpoint
      }
      // 如果没有存储的端点，返回服务的默认端点
      const svc = serviceOptions.find(s => s.value === type.value) ?? serviceOptions[0]
      return svc.endpoint
    },
    set(val: string) {
      localStorage.setItem(`openai_endpoint_${type.value}`, val)
      trigger()
    },
  }))

  /* ————— apiKey：按 service 前缀持久化 ————— */
  const apiKey = customRef<string>((track, trigger) => ({
    get() {
      track()
      const storedKey = localStorage.getItem(`openai_key_${type.value}`)
      if (storedKey) {
        return storedKey
      }
      // 如果没有存储的密钥，对于 deepseek 服务返回默认密钥
      if (type.value === `deepseek`) {
        return DEFAULT_DEEPSEEK_KEY
      }
      return DEFAULT_SERVICE_KEY
    },
    set(val: string) {
      if (type.value !== `default`) {
        localStorage.setItem(`openai_key_${type.value}`, val)
      }
      trigger()
    },
  }))

  /* ————— temperature：按 service 前缀持久化 ————— */
  const temperature = customRef<number>((track, trigger) => ({
    get() {
      track()
      const storedTemp = localStorage.getItem(`openai_temperature_${type.value}`)
      if (storedTemp) {
        return Number(storedTemp)
      }
      return DEFAULT_SERVICE_TEMPERATURE
    },
    set(val: number) {
      localStorage.setItem(`openai_temperature_${type.value}`, String(val))
      trigger()
    },
  }))

  /* ————— maxToken：按 service 前缀持久化 ————— */
  const maxToken = customRef<number>((track, trigger) => ({
    get() {
      track()
      const storedToken = localStorage.getItem(`openai_max_token_${type.value}`)
      if (storedToken) {
        return Number(storedToken)
      }
      return DEFAULT_SERVICE_MAX_TOKEN
    },
    set(val: number) {
      localStorage.setItem(`openai_max_token_${type.value}`, String(val))
      trigger()
    },
  }))

  /* ————————————————— 核心逻辑 ————————————————— */

  // ① type 变化（含首次加载）→ 同步 model
  watch(
    type,
    (newType) => {
      const svc = serviceOptions.find(s => s.value === newType) ?? serviceOptions[0]

      // 读取或回退模型
      const saved = localStorage.getItem(`openai_model_${newType}`) || ``

      // 如果服务有预定义模型列表
      if (svc.models.length > 0) {
        model.value = svc.models.includes(saved) ? saved : svc.models[0]
      }
      // 如果服务没有预定义模型（如 custom），使用已保存的值或空字符串
      else {
        model.value = saved
      }

      // 如有回退，写回存储保持一致
      if (model.value) {
        localStorage.setItem(`openai_model_${newType}`, model.value)
      }
    },
    { immediate: true }, // ⬅️ 关键：首次也执行
  )

  // ② model 变化 → 持久化到对应 service 键
  watch(model, (val) => {
    localStorage.setItem(`openai_model_${type.value}`, val)
  })

  /* ————— actions ————— */

  function reset() {
    type.value = DEFAULT_SERVICE_TYPE

    // 清理所有 service 相关持久化
    serviceOptions.forEach(({ value }) => {
      localStorage.removeItem(`openai_key_${value}`)
      localStorage.removeItem(`openai_model_${value}`)
      localStorage.removeItem(`openai_endpoint_${value}`)
      localStorage.removeItem(`openai_temperature_${value}`)
      localStorage.removeItem(`openai_max_token_${value}`)
    })

    // 为 deepseek 设置默认密钥
    if (DEFAULT_SERVICE_TYPE === `deepseek`) {
      localStorage.setItem(`openai_key_deepseek`, DEFAULT_DEEPSEEK_KEY)
    }
  }

  return {
    // state
    type,
    endpoint,
    model,
    temperature,
    maxToken,
    apiKey,

    // actions
    reset,
  }
})
