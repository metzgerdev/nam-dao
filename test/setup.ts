import { afterEach, beforeEach } from "bun:test";
import { Window } from "happy-dom";

const windowInstance = new Window({
  url: "http://localhost/",
});

for (const errorName of [
  "Error",
  "TypeError",
  "SyntaxError",
  "RangeError",
  "ReferenceError",
  "EvalError",
  "URIError",
] as const) {
  if (typeof windowInstance[errorName as keyof Window] === "undefined") {
    Object.defineProperty(windowInstance, errorName, {
      configurable: true,
      writable: true,
      value: globalThis[errorName],
    });
  }
}

function installGlobal(name: string, value: unknown): void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);

  if (descriptor && !descriptor.configurable && !descriptor.writable) {
    return;
  }

  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
}

for (const propertyName of Object.getOwnPropertyNames(windowInstance)) {
  if (propertyName in globalThis) {
    continue;
  }

  Object.defineProperty(globalThis, propertyName, {
    configurable: true,
    get() {
      return windowInstance[propertyName as keyof Window];
    },
  });
}

installGlobal("window", windowInstance);
installGlobal("document", windowInstance.document);
installGlobal("navigator", windowInstance.navigator);
installGlobal("location", windowInstance.location);
installGlobal("history", windowInstance.history);
installGlobal("HTMLElement", windowInstance.HTMLElement);
installGlobal("HTMLButtonElement", windowInstance.HTMLButtonElement);
installGlobal("HTMLInputElement", windowInstance.HTMLInputElement);
installGlobal("SVGElement", windowInstance.SVGElement);
installGlobal("Node", windowInstance.Node);
installGlobal("Event", windowInstance.Event);
installGlobal("EventTarget", windowInstance.EventTarget);
installGlobal("CustomEvent", windowInstance.CustomEvent);
installGlobal("HashChangeEvent", windowInstance.HashChangeEvent);
installGlobal("MouseEvent", windowInstance.MouseEvent);
installGlobal("KeyboardEvent", windowInstance.KeyboardEvent);
installGlobal(
  "getComputedStyle",
  windowInstance.getComputedStyle.bind(windowInstance),
);
installGlobal(
  "requestAnimationFrame",
  windowInstance.requestAnimationFrame.bind(windowInstance),
);
installGlobal(
  "cancelAnimationFrame",
  windowInstance.cancelAnimationFrame.bind(windowInstance),
);
installGlobal("matchMedia", windowInstance.matchMedia.bind(windowInstance));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await import("@testing-library/jest-dom");

const { cleanup } = await import("@testing-library/react");

beforeEach(() => {
  windowInstance.document.body.innerHTML = "";
  windowInstance.document.head.innerHTML = "";
  windowInstance.history.replaceState({}, "", "/");
});

afterEach(() => {
  cleanup();
  windowInstance.document.body.innerHTML = "";
  windowInstance.document.head.innerHTML = "";
  windowInstance.history.replaceState({}, "", "/");
});
