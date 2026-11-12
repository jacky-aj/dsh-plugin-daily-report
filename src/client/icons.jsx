import React from "react";

// Inline SVG icons used by the page.
export function Icon() {
  return (
    <svg viewBox="0 0 64 64" width={26} height={26} aria-hidden={true}>
      <rect width={64} height={64} rx={14} fill="#1f4e79" />
      <path
        d="M17 19h30a3 3 0 0 1 3 3v26a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V22a3 3 0 0 1 3-3z"
        fill="#f7fbff"
      />
      <path d="M14 27h36v4H14z" fill="#8db9e2" />
      <path
        d="M22 14v8M42 14v8"
        stroke="#bfe0ff"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path d="M22 38h7v7h-7zM33 38h7v7h-7zM22 48h7v3h-7z" fill="#1f7a5c" />
      <path
        d="M33 48h9"
        stroke="#e0a526"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}
export function PanelIcon(props) {
  const size = Number(props && props.size) > 0 ? Number(props.size) : 20;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <rect x={3.5} y={4.5} width={17} height={15} rx={2.5} />
      <path d="M8 3v3M16 3v3M3.5 9h17" />
      <path d="M8 13h3M8 16.5h3M14 13h2.5M14 16.5h2.5" />
    </svg>
  );
}
export function SaveIcon(props) {
  const size = Number(props && props.size) > 0 ? Number(props.size) : 15;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="M5 3.5h11l3.5 3.5v13.5H5z" />
      <path d="M8 3.5v5h7v-5M8 20.5v-6h8v6" />
    </svg>
  );
}
export function GenerateIcon(props) {
  const size = Number(props && props.size) > 0 ? Number(props.size) : 15;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="M6 3.5h8l4 4v13H6z" />
      <path d="M14 3.5v4h4M9 12h6M9 15.5h4" />
      <path d="M18.5 16.5v4M16.5 18.5h4" />
    </svg>
  );
}
export function ChevronIcon(props) {
  const size = Number(props && props.size) > 0 ? Number(props.size) : 12;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
export function InfoDot(props) {
  return (
    <span
      className="dsdr-info"
      role="img"
      tabIndex={0}
      aria-label={props.text}
      data-tip={props.text}
    >
      i
    </span>
  );
}
export function RefreshIcon(props) {
  const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}
export function PlayIcon(props) {
  const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden={true}
    >
      <path d="M8 5.5v13l10-6.5z" />
    </svg>
  );
}
export function TestIcon(props) {
  const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <circle cx={12} cy={12} r={9} />
      <path d="M7.5 12.5l3 3 6-6.5" />
    </svg>
  );
}
export function ScanIcon(props) {
  const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="M3.5 7.5h6l2 2h9v9.5h-17z" />
      <path d="M3.5 7.5V5h5l2 2" />
      <circle cx={15} cy={14.5} r={2.2} />
      <path d="M16.6 16.1l2 2" />
    </svg>
  );
}
export function DownloadIcon(props) {
  const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="M12 3.5v11M7.5 10.5l4.5 4.5 4.5-4.5" />
      <path d="M4.5 17.5v2h15v-2" />
    </svg>
  );
}
export function UploadIcon(props) {
  const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="M12 15.5v-11M7.5 8.5L12 4l4.5 4.5" />
      <path d="M4.5 17.5v2h15v-2" />
    </svg>
  );
}
// __UI_PARTS__

