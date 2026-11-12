import React from "react";

export function Button({
  variant = "default",
  icon = null,
  className = "",
  children,
  ...props
}) {
  const classes = [
    "dsdr-btn",
    variant === "primary" ? "dsdr-btn-primary" : "",
    variant === "danger" ? "dsdr-btn-danger" : "",
    icon ? "dsdr-btn-with-icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={classes} {...props}>
      {icon}
      {children}
    </button>
  );
}

