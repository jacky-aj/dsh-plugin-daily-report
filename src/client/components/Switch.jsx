import React from "react";

export function Switch({ checked, disabled = false, onChange, label }) {
  return (
    <label
      className={"dsdr-switch" + (disabled ? " is-disabled" : "")}
      title={label}
    >
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="dsdr-switch-track" aria-hidden="true">
        <span className="dsdr-switch-thumb" />
      </span>
    </label>
  );
}

