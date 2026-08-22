import React from "react";
import Layout from "./Layout.jsx";

// Vite turns every page into its own lazy chunk. This replaces the generated
// eager page registry at runtime without modifying pages.config.js.
const pageModules = import.meta.glob("./pages/*.{js,jsx,ts,tsx}");

function pageName(path) {
  return path.split("/").pop().replace(/\.(jsx?|tsx?)$/, "");
}

export const Pages = Object.fromEntries(
  Object.entries(pageModules).map(([path, loader]) => [
    pageName(path),
    React.lazy(async () => {
      const module = await loader();
      return { default: module.default };
    }),
  ]),
);

export const mainPage = "Home";
export { Layout };

export const pagesConfig = {
  mainPage,
  Pages,
  Layout,
};
