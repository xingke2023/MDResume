<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'

interface MpConfig {
  appID: string
  appsecret: string
}

const props = defineProps<{
  visible: boolean
  initialConfig?: MpConfig
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'saved': [config: MpConfig]
}>()

const mpConfigForm = ref<MpConfig>({
  appID: props.initialConfig?.appID || ``,
  appsecret: props.initialConfig?.appsecret || ``,
})

function closeDialog() {
  emit('update:visible', false)
}

function saveMpConfig() {
  if (!mpConfigForm.value.appID.trim() || !mpConfigForm.value.appsecret.trim()) {
    toast.error(`AppID 和 AppSecret 不能为空`)
    return
  }

  localStorage.setItem(`mpConfig`, JSON.stringify(mpConfigForm.value))
  toast.success(`公众号配置保存成功`)
  emit('saved', mpConfigForm.value)
  closeDialog()
}
</script>

<template>
  <div
    v-if="visible"
    class="backdrop-blur-sm fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
    @click="closeDialog"
  >
    <div
      class="max-w-md w-full scale-100 transform rounded-2xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800"
      @click.stop
    >
      <!-- 标题 -->
      <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 class="text-center text-xl text-gray-900 font-bold dark:text-gray-100">
          配置公众号信息
        </h3>
      </div>

      <!-- 表单 -->
      <div class="px-6 py-6">
        <div class="space-y-4">
          <!-- 提示信息 -->
          <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p class="text-sm text-blue-800 dark:text-blue-300">
              <span class="font-medium">💡 提示：</span>请输入您的微信公众号 AppID 和 AppSecret，用于发布文章到公众号
            </p>
          </div>

          <!-- AppID -->
          <div class="flex items-center gap-2 pl-[5px]">
            <label class="w-20 flex-shrink-0 whitespace-nowrap text-sm text-gray-700 font-medium dark:text-gray-300">
              AppID<span class="text-red-500">*</span>
            </label>
            <input
              v-model="mpConfigForm.appID"
              type="text"
              placeholder="请输入公众号 AppID"
              class="dark:placeholder-gray-400 max-w-[14rem] flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm text-gray-900 transition-colors dark:border-gray-600 focus:border-green-500 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
          </div>

          <!-- AppSecret -->
          <div class="flex items-center gap-2 pl-[5px]">
            <label class="w-20 flex-shrink-0 whitespace-nowrap text-sm text-gray-700 font-medium dark:text-gray-300">
              AppSecret<span class="text-red-500">*</span>
            </label>
            <input
              v-model="mpConfigForm.appsecret"
              type="password"
              placeholder="请输入公众号 AppSecret"
              class="dark:placeholder-gray-400 max-w-[14rem] flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm text-gray-900 transition-colors dark:border-gray-600 focus:border-green-500 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
          </div>

          <!-- 帮助信息 -->
          <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
            <p class="text-xs text-gray-600 dark:text-gray-400">
              <span class="font-medium">如何获取：</span><br>1、登录微信公众平台 https://mp.weixin.qq.com/ <br>设置与开发 → 开发接口管理 → 基本配置 → 开发者ID(AppID) 和 开发者密钥(AppSecret) <br>2、需要将43.153.64.160加入IP白名单<br>3、必须是已认证的公众号
            </p>
          </div>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
        <div class="flex justify-end gap-3">
          <Button
            variant="outline"
            class="flex-1"
            @click="closeDialog"
          >
            取消
          </Button>
          <Button
            class="from-green-500 to-blue-600 bg-gradient-to-r hover:from-green-600 hover:to-blue-700 flex-1 border-0 text-white"
            :disabled="!mpConfigForm.appID.trim() || !mpConfigForm.appsecret.trim()"
            @click="saveMpConfig"
          >
            保存配置
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
