import type { Preview } from "@storybook/react";
import React from "react";
import "../app/app.css";
import { createRoutesStub } from "react-router";


const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      const ReactRouterStub = createRoutesStub([
        {
          path: "/*",
          Component: () => <Story />,
        },
      ]);

      return <ReactRouterStub />;
    },
  ],
};

export default preview;


