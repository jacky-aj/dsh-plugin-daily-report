import React from "react";

export function useMenus() {
  const [formatMenuOpen, setFormatMenuOpen] = React.useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = React.useState(false);
  const formatMenuRef = React.useRef(null);
  const settingsMenuRef = React.useRef(null);
  const settingsFileRef = React.useRef(null);

  React.useEffect(() => {
    if (!formatMenuOpen) return;
    const close = (event) => {
      if (
        formatMenuRef.current &&
        !formatMenuRef.current.contains(event.target)
      ) {
        setFormatMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [formatMenuOpen]);

  React.useEffect(() => {
    if (!settingsMenuOpen) return;
    const close = (event) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target)
      ) {
        setSettingsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [settingsMenuOpen]);

  return {
    formatMenuOpen,
    setFormatMenuOpen,
    settingsMenuOpen,
    setSettingsMenuOpen,
    formatMenuRef,
    settingsMenuRef,
    settingsFileRef,
  };
}

