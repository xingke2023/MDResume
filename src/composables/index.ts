import { useFileDialog } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { useStore } from '@/stores'

export function useImportMarkdownContent() {
  const store = useStore()
  const { open, reset, onChange } = useFileDialog({
    accept: `.md`,
  })

  onChange((files: FileList | null) => {
    if (files == null || files.length === 0) {
      return
    }

    const file = files[0]
    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = (event) => {
      store.editor!.setValue(event.target!.result as string)
      toast.success(`文档导入成功`)
    }
  })

  // 导入 Markdown 文档
  return () => {
    reset()
    open()
  }
}
