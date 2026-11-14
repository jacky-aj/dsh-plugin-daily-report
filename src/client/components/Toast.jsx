import React from "react";

function ToastIcon({ tone }) {
  if (tone === "error") {
    return (
      <span className="dsdr-toast-icon is-error" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span className="dsdr-toast-icon" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
        <path
          d="M3.5 8.5l3 3 6-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Toast({ toast, onDismiss }) {
  if (!toast || !toast.message) return null;
  return (
    <div className="dsdr-toast-wrap" role="status" aria-live="polite">
      <div className="dsdr-toast" key={toast.id}>
        <ToastIcon tone={toast.tone} />
        <span className="dsdr-toast-text">{toast.message}</span>
        {onDismiss ? (
          <button
            type="button"
            className="dsdr-toast-close"
            aria-label="关闭"
            onClick={onDismiss}
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
