"use client"

import { Toast } from "@base-ui/react/toast"
import { cn } from "@/lib/utils"

export const ToastProvider = Toast.Provider
export const useToastManager = Toast.useToastManager

function ToastList() {
  const { toasts } = useToastManager()

  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] mr-0 w-[min(24rem,90vw)] rounded-xl border bg-card p-4 shadow-lg transition-all",
        "data-[type=error]:border-destructive/50",
        "[transform:translateX(0)_translateY(calc(var(--toast-offset-y)*-1))]",
        "data-[starting-style]:[transform:translateX(0)_translateY(calc(var(--toast-offset-y)*-1)_translateY(20%))] data-[starting-style]:opacity-0",
        "data-[ending-style]:opacity-0"
      )}
      swipeDirection={["right", "down"]}
    >
      <Toast.Content className="flex flex-col gap-1">
        <Toast.Title className="text-sm font-semibold" />
        <Toast.Description className="text-sm text-muted-foreground" />
      </Toast.Content>
      <Toast.Close
        aria-label="Dismiss"
        className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        &times;
      </Toast.Close>
    </Toast.Root>
  ))
}

export function Toaster() {
  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed right-4 bottom-4 z-50 mx-auto flex w-[min(24rem,90vw)]">
        <ToastList />
      </Toast.Viewport>
    </Toast.Portal>
  )
}
