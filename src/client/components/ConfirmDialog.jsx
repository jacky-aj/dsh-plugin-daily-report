import React from "react";

export function ConfirmDialog({
  open = false,
  title = "",
  message = "",
  confirmLabel = "确认",
  cancelLabel = "取消",
  danger = false,
  onConfirm,
  onCancel,
}) {
  const titleId = React.useId();
  if (!open) return null;
  return (
    <div
      className="dsdr-confirm-backdrop"
      role="presentation"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <div
        className="dsdr-confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          backgroundColor: "#1f2328",
          color: "#f5f7fa",
          borderColor: "rgba(255, 255, 255, 0.16)",
        }}
      >
        <h2 className="dsdr-confirm-title" id={titleId}>
          {title}
        </h2>
        <div className="dsdr-confirm-message" style={{ color: "#c9d1d9" }}>
          {message}
        </div>
        <div className="dsdr-confirm-actions">
          <button
            type="button"
            className="dsdr-btn"
            onClick={(event) => {
              event.stopPropagation();
              onCancel?.();
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={"dsdr-btn " + (danger ? "dsdr-btn-danger" : "dsdr-btn-primary")}
            onClick={(event) => {
              event.stopPropagation();
              onConfirm?.();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

