/// <reference types="vite/client" />

declare module "toast-anchor" {
  type ToastPosition =
    | "top-left"
    | "top-center"
    | "top-right"
    | "middle-left"
    | "middle-center"
    | "middle-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";

  type ToastOptions = {
    description?: string;
    position?: ToastPosition;
    duration?: number;
    showProgress?: boolean;
    sound?: boolean;
    id?: string;
  };

  type ToastApi = {
    success: (message: string, options?: ToastOptions) => () => void;
    dismissAll: () => void;
  };

  const toast: ToastApi;
  export default toast;
  export function configure(options: {
    position?: ToastPosition;
    duration?: number;
    sound?: boolean;
    showProgress?: boolean;
    theme?: { success?: { bg?: string; light?: string } };
    toast?: {
      width?: string;
      color?: string;
      descColor?: string;
      borderColor?: string;
      borderRadius?: string;
    };
  }): void;
  export function dismissAll(): void;
}
