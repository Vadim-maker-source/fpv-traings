import { toast as sonnerToast } from "sonner";

export const useToast = () => {
  return {
    toast: ({ title, description, variant }: any) => {
      if (variant === "destructive") {
        sonnerToast.error(title, { description });
      } else {
        sonnerToast.success(title, { description });
      }
    },
  };
};