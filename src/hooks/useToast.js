import { useApp } from "../contexts/AppContext";
export const useToast = () => {
  const { addToast } = useApp();
  return { toast: addToast };
};
