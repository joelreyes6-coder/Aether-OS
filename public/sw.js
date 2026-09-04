import { BareMuxConnection } from "@mercuryworkshop/bare-mux";

let scramjet = null;

const SCRAMJET_REPAIR_KEY =
  "my-os-scramjet-repair-attempted";

const SCRAMJET_RETURN_KEY =
  "my-os-scramjet-repair-return";

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

function isMissingObjectStoreError(error) {
  if (!error) {
    return false;
  }

  const name = String(
    error.name || ""
  );

  const message = String(
    error.message || ""
  ).toLowerCase();

  return (
    name === "NotFoundError" &&
    message.includes("object store")
  );
}

function startScramjetRepair() {
  if (
    sessionStorage.getItem(
      SCRAMJET_REPAIR_KEY
    ) === "1"
  ) {
    console.error(
      "Scramjet repair was already attempted during this session."
    );

    return false;
  }

  sessionStorage.setItem(
    SCRAMJET_REPAIR_KEY,
    "1"
  );

  sessionStorage.setItem(
    SCRAMJET_RETURN_KEY,
    window.location.href
  );

  console.warn(
    "Scramjet has a broken IndexedDB schema. Leaving Aether to repair it."
  );

  window.location.replace(
    "/scramjet-repair.html"
  );

  return true;
}

function waitForServiceWorker(
  registration
) {
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

  return new Promise(
    (resolve, reject) => {
      const timeout =
        setTimeout(() => {
          reject(
            new Error(
              "Timed out waiting for Scramjet service worker."
            )
          );
        }, 10000);

      function handleStateChange() {
        if (
          worker.state ===
          "activated"
        ) {
          clearTimeout(
            timeout
          );

          worker.removeEventListener(
            "statechange",
            handleStateChange
          );

          resolve();
        }

        if (
          worker.state ===
          "redundant"
        ) {
          clearTimeout(
            timeout
          );

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
    }
  );
}

export async function setupBareMux() {
  const connection =
    new BareMuxConnection(
      "/baremux-worker.js"
    );

  await connection.setTransport(
    "/libcurl.mjs",
    [
      {
        websocket:
          getWispUrl(),
      },
    ]
  );

  return connection;
}

export async function setupScramjet() {
  if (
    !(
      "serviceWorker" in
      navigator
    )
  ) {
    throw new Error(
      "Service workers are not supported."
    );
  }

  const registration =
    await navigator.serviceWorker.register(
      "/sw.js",
      {
        type: "module",
        scope: "/scramjet/",
      }
    );

  await waitForServiceWorker(
    registration
  );

  if (
    !globalThis.$scramjetLoadController
  ) {
    throw new Error(
      "Scramjet bundle did not load."
    );
  }

  const {
    ScramjetController,
  } =
    globalThis.$scramjetLoadController();

  const controller =
    new ScramjetController({
      prefix: "/scramjet/",

      files: {
        wasm:
          "/scramjet.wasm.wasm",

        all:
          "/scramjet.all.js",

        sync:
          "/scramjet.sync.js",
      },
    });

  try {
    await controller.init();
  } catch (error) {
    if (
      isMissingObjectStoreError(
        error
      )
    ) {
      const repairing =
        startScramjetRepair();

      if (repairing) {
        return null;
      }
    }

    throw error;
  }

  sessionStorage.removeItem(
    SCRAMJET_REPAIR_KEY
  );

  sessionStorage.removeItem(
    SCRAMJET_RETURN_KEY
  );

  scramjet = controller;

  return scramjet;
}

export function getScramjet() {
  return scramjet;
}