/// <reference types="vite/client" />

declare module "@cagrmeister/design/logo.png" {
  const src: string;
  export default src;
}

declare module "@cagrmeister/design/fonts.css";
declare module "@cagrmeister/design/components.css";
declare module "@cagrmeister/design/table.css";
declare module "@cagrmeister/design/strict.css";

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
