import React from "react";

const TOAST_DURATION = 3200;

export function useToast() {
  const [toast, setToast] = React.useState(null);
  const timerRef = React.useRef(null);

  const dismissToast = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = React.useCallback((message, tone = "success") => {
    if (!message) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, tone, id: Date.now() });
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setToast(null);
    }, TOAST_DURATION);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, showToast, dismissToast };
}
