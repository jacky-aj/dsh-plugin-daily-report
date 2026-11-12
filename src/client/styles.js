import css from "./styles.css?raw";

export function installStyles(ctx) {
  const style = document.createElement("style");
  style.dataset.plugin = "dsh-plugin-daily-report";
  style.textContent = css;
  document.head.appendChild(style);
  ctx.effect(() => () => style.remove(), "daily-report: styles");
}
