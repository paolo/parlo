import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// Mantine relies on matchMedia, which jsdom does not implement.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mantine's autosizing Textarea listens for font loading, which jsdom does not implement.
if (!document.fonts) {
  Object.defineProperty(document, "fonts", {
    value: {
      addEventListener: () => {},
      removeEventListener: () => {},
      ready: Promise.resolve(),
    },
  });
}

// Mantine's Select (Combobox, ScrollArea) needs these; jsdom has neither.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver ??= ResizeObserverStub;
window.HTMLElement.prototype.scrollIntoView ??= () => {};
