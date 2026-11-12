// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import * as icons from "../../src/client/icons.jsx";

afterEach(cleanup);

describe("icons", () => {
  it("renders every icon", () => {
    for (const [name, Icon] of Object.entries(icons)) {
      const { container, unmount } = render(React.createElement(Icon, { size: 16 }));
      expect(container.firstChild, name).toBeTruthy();
      unmount();
    }
  });
});

