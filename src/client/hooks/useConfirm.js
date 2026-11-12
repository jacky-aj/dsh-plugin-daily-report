import React from "react";

export function useConfirm() {
  const [request, setRequest] = React.useState(null);
  const resolverRef = React.useRef(null);

  function confirm(options) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setRequest(options || {});
    });
  }

  function finish(result) {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setRequest(null);
    if (resolve) resolve(result);
  }

  return {
    confirm,
    dialogProps: {
      open: request !== null,
      ...(request || {}),
      onConfirm: () => finish(true),
      onCancel: () => finish(false),
    },
  };
}
