import { BareMuxConnection } from "@mercuryworkshop/bare-mux";

let scramjet = null;

function getWispUrl() {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocal) {
    return "ws://127.0.0.1:5001/";
  }

  const protocol =
    window.location.protocol === "https:"
      ? "wss:"
      : "ws:";

  return `${protocol}//${window.location.host}/`;
}

function waitForServiceWorker(registration) {
  if (registration.active) {
    return Promise.resolve();
  }

  const worker =
    registration.installing ||
    registration.waiting;

  if (!worker) {
    return Promise.reject(
      new Error(
        "Scramjet service worker was not found."
      )
    );
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          "Timed out waiting for Scramjet service worker."
        )
      );
    }, 10000);

    function handleStateChange() {
      if (worker.state === "activated") {
        clearTimeout(timeout);
        worker.removeEventListener(
          "statechange",
          handleStateChange
        );
        resolve();
      }

      if (worker.state === "redundant") {
        clearTimeout(timeout);
        worker.removeEventListener(
          "statechange",
          handleStateChange
        );
        reject(
          new Error(
            "Scramjet service worker became redundant."
          )
        );
      }
    }

    worker.addEventListener(
      "statechange",
      handleStateChange
    );

    handleStateChange();
  });
}

export async function setupBareMux() {
  const connection = new BareMuxConnection(
    "/baremux-worker.js"
  );

  await connection.setTransport("/libcurl.mjs", [
    {
      websocket: getWispUrl(),
    },
  ]);

  return connection;
}

export async function setupScramjet() {
  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "Service workers are not supported."
    );
  }

  const registration =
    await navigator.serviceWorker.register("/sw.js", {
      type: "module",
      scope: "/scramjet/",
    });

  await waitForServiceWorker(registration);

  if (!globalThis.$scramjetLoadController) {
    throw new Error(
      "Scramjet bundle did not load."
    );
  }

  const { ScramjetController } =
    globalThis.$scramjetLoadController();

  const controller = new ScramjetController({
    prefix: "/scramjet/",

    files: {
      wasm: "/scramjet.wasm.wasm",
      all: "/scramjet.all.js",
      sync: "/scramjet.sync.js",
    },
  });

  await controller.init();

  scramjet = controller;

  return scramjet;
}

export function getScramjet() {
  return scramjet;
}