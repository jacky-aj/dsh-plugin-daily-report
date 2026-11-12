import React from "react";

export const AppContext = React.createContext(null);

let currentApp = null;

export function setApp(app) {
  currentApp = app;
  return app;
}

export function useApp() {
  return React.useContext(AppContext) || currentApp;
}
