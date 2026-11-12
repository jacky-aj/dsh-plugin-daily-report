import React from "react";

export function Card({ className = "", children, ...props }) {
  return (
    <section className={("dsdr-card " + className).trim()} {...props}>
      {children}
    </section>
  );
}

