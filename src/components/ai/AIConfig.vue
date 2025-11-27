<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { serviceOptions } from '@/config/ai-services'
import { DEFAULT_SERVICE_TYPE } from '@/constants/AIConfig'
import useAIConfigStore from '@/stores/AIConfig'

/* -------------------------- 基础数据 -------------------------- */

const emit = defineEmits([`saved`])

const AIConfigStore = useAIConfigStore()
const { type, endpoint, model, apiKey, temperature, maxToken }
  = storeToRefs(AIConfigStore)

/** 本地草稿 */
const config = reactive({
  type: ``,
  endpoint: ``,
  apiKey: ``,
  model: ``,
  temperature: 1,
  maxToken: 1024,
})

/** UI 状态 */
const loading = ref(false)
const testResult = ref(``)

/** 当前服务信息 */
const currentService = computed(
  () => serviceOptions.find(s => s.value === config.type) || serviceOptions[0],
)

/* -------------------------- 同步函数 -------------------------- */

function pullFromStore() {
  config.type = type.value
  config.endpoint = endpoint.value
  // 对于 deepseek 服务，如果使用的是系统默认密钥，界面显示空值
  const currentKey = apiKey.value
  if (config.type === `deepseek` && currentKey === `sk-f7fccdf51bda44ff8830dc18b8b5bf6e`) {
    config.apiKey = ``
  }
  else {
    config.apiKey = currentKey
  }
  config.model = model.value
  config.temperature = temperature.value
  config.maxToken = maxToken.value
}
pullFromStore() // 首屏同步一次

/* -------------------------- 监听 -------------------------- */

watch(
  () => config.type,
  async () => {
    // 先更新 store 的 type，触发 store 内部的响应式更新
    type.value = config.type
    // 等待下一个 tick，确保 store 的 watch(type) 已执行完毕
    await nextTick()
    // 然后从 store 同步所有参数到本地配置
    config.endpoint = endpoint.value
    // 对于 deepseek 服务，如果使用的是系统默认密钥，界面显示空值
    const currentKey = apiKey.value
    if (config.type === `deepseek` && currentKey === `sk-f7fccdf51bda44ff8830dc18b8b5bf6e`) {
      config.apiKey = ``
    }
    else {
      config.apiKey = currentKey
    }
    config.model = model.value
    config.temperature = temperature.value
    config.maxToken = maxToken.value
    testResult.value = ``
  },
)

watch(() => config.model, () => (testResult.value = ``))

/* -------------------------- 操作 -------------------------- */

function saveConfig(emitEvent = true) {
  // 先确保 store 的 type 是最新的
  type.value = config.type

  // 然后设置其他参数，这样会保存到正确的服务类型下
  endpoint.value = config.endpoint
  model.value = config.model
  temperature.value = config.temperature
  maxToken.value = config.maxToken

  // 对于 deepseek 服务，如果用户输入为空，则保存系统默认密钥
  if (config.type === `deepseek` && !config.apiKey.trim()) {
    apiKey.value = `sk-f7fccdf51bda44ff8830dc18b8b5bf6e`
  }
  else {
    apiKey.value = config.apiKey
  }

  if (emitEvent) {
    testResult.value = `✅ 配置已保存`
    emit(`saved`)
  }
}

function clearConfig() {
  AIConfigStore.reset()
  pullFromStore()
  testResult.value = `🗑️ 当前 AI 配置已清除`
}

async function testConnection() {
  testResult.value = ``
  loading.value = true

  const headers: Record<string, string> = { 'Content-Type': `application/json` }
  if (config.apiKey && config.type !== DEFAULT_SERVICE_TYPE)
    headers.Authorization = `Bearer ${config.apiKey}`

  try {
    const url = new URL(config.endpoint)
    if (!url.pathname.endsWith(`/chat/completions`))
      url.pathname = url.pathname.replace(/\/?$/, `/chat/completions`)

    const payload = {
      model: config.model,
      messages: [{ role: `user`, content: `ping` }],
      temperature: 0,
      max_tokens: 1,
      stream: false,
    }

    const res = await window.fetch(url.toString(), {
      method: `POST`,
      headers,
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      testResult.value = `✅ 测试成功，/chat/completions 可用`
      saveConfig(false)
    }
    else {
      const text = await res.text()
      try {
        const { error } = JSON.parse(text)
        if (
          res.status === 404
          && (error?.code === `ModelNotOpen`
            || /not activated|未开通/i.test(error?.message))
        ) {
          testResult.value = `⚠️ 测试成功，但当前模型未开通：${config.model}`
          saveConfig(false)
          return
        }
      }
      catch {}
      testResult.value = `❌ 测试失败：${res.status} ${res.statusText}，${text}`
    }
  }
  catch (err) {
    testResult.value = `❌ 测试失败：${(err as Error).message}`
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="custom-scroll space-y-4 max-h-[calc(100dvh-10rem)] overflow-y-auto pr-1 text-xs sm:max-h-none sm:text-sm">
    <div class="font-medium">
      AI 配置
    </div>

    <!-- 服务类型 -->
    <div class="flex items-center gap-2">
      <Label class="w-14 flex-shrink-0 text-sm font-medium">服务类型</Label>
      <Select v-model="config.type" class="flex-1">
        <SelectTrigger class="w-full">
          <SelectValue>
            {{ currentService.label }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="service in serviceOptions"
            :key="service.value"
            :value="service.value"
          >
            {{ service.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- API 端点 -->
    <div v-if="config.type !== 'default'" class="flex items-center gap-2">
      <Label class="w-14 flex-shrink-0 text-sm font-medium">API 端点</Label>
      <Input
        v-model="config.endpoint"
        placeholder="输入 API 端点 URL"
        class="flex-1 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
      />
    </div>

    <!-- API 密钥，仅非 default 显示 -->
    <div v-if="config.type !== 'default'" class="flex items-center gap-2">
      <Label class="w-14 flex-shrink-0 text-sm font-medium">API 密钥</Label>
      <Input
        v-model="config.apiKey"
        type="password"
        placeholder="sk-..."
        class="flex-1 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
      />
    </div>

    <!-- 模型名称 -->
    <div class="flex items-center gap-2">
      <Label class="w-14 flex-shrink-0 text-sm font-medium">模型名称</Label>
      <Select v-if="currentService.models.length > 0" v-model="config.model" class="flex-1">
        <SelectTrigger class="w-full">
          <SelectValue>
            {{ config.model || '请选择模型' }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="_model in currentService.models"
            :key="_model"
            :value="_model"
          >
            {{ _model }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Input
        v-else
        v-model="config.model"
        placeholder="输入模型名称"
        class="flex-1 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
      />
    </div>

    <!-- 温度 temperature -->
    <div class="flex items-center gap-2">
      <Label class="w-14 flex flex-shrink-0 items-center gap-1 text-sm font-medium">
        温度
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Info class="text-gray-500" :size="16" />
            </TooltipTrigger>
            <TooltipContent>
              <div>控制输出的随机性：较低的值使输出更确定，较高的值使其更随机。</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
      <Input
        v-model.number="config.temperature"
        type="number"
        step="0.1"
        min="0"
        max="2"
        placeholder="0 ~ 2，默认 1"
        class="flex-1 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
      />
    </div>

    <!-- 最大 Token 数 -->
    <div class="flex items-center gap-2">
      <Label class="w-24 flex-shrink-0 text-sm font-medium">最大 Token 数</Label>
      <Input
        v-model.number="config.maxToken"
        type="number"
        min="1"
        max="32768"
        placeholder="推荐 8000"
        class="flex-1 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
      />
    </div>

    <!-- 操作按钮区域 -->
    <div class="mt-2 flex justify-center gap-2">
      <Button size="sm" @click="saveConfig">
        保存
      </Button>
      <Button size="sm" variant="ghost" @click="clearConfig">
        清空
      </Button>
      <Button
        size="sm"
        variant="outline"
        :disabled="loading"
        @click="testConnection"
      >
        {{ loading ? '测试中...' : '测试连接' }}
      </Button>
    </div>

    <!-- 测试结果显示 -->
    <div v-if="testResult" class="mt-1 text-xs text-gray-500">
      {{ testResult }}
    </div>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
@media (pointer: coarse) {
  /* 触屏设备更细 */
  .custom-scroll::-webkit-scrollbar {
    width: 3px;
  }
}

.custom-scroll::-webkit-scrollbar-thumb {
  @apply rounded-full bg-gray-400/40 hover:bg-gray-400/60;
  @apply dark:bg-gray-500/40 dark:hover:bg-gray-500/70;
}
.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgb(156 163 175 / 0.4) transparent;
}
.dark .custom-scroll {
  scrollbar-color: rgb(107 114 128 / 0.4) transparent;
}
</style>
