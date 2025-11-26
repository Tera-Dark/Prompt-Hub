import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function add(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }
    toasts.value.push(newToast)

    if (toast.duration !== 0) {
      setTimeout(() => {
        remove(id)
      }, toast.duration ?? 3000)
    }
  }

  function remove(id: string) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  function success(message: string, duration?: number) {
    add({ message, type: 'success', duration })
  }

  function error(message: string, duration?: number) {
    add({ message, type: 'error', duration })
  }

  function info(message: string, duration?: number) {
    add({ message, type: 'info', duration })
  }

  function warning(message: string, duration?: number) {
    add({ message, type: 'warning', duration })
  }

  return {
    toasts,
    add,
    remove,
    success,
    error,
    info,
    warning,
  }
}
