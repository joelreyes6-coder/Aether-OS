import { BareMuxConnection } from "@mercuryworkshop/bare-mux";

let scramjet = null;

export async function setupBareMux() {
  const connection = new BareMuxConnection("/baremux-worker.js");

  await connection.setTransport("/libcurl.mjs", [
    {
      websocket: "ws://127.0.0.1:5001/",
    },
  ]);

  return connection;
}

export async function setupScramjet() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js", {
    type: "module",
  });

  await navigator.serviceWorker.ready;

  if (!navigator.serviceWorker.controller) {
    console.log("Service worker installed. Reloading once...");
    window.location.reload();
    return;
  }

  if (!globalThis.$scramjetLoadController) {
    throw new Error("Scramjet bundle did not load.");
  }

  const { ScramjetController } =
    globalThis.$scramjetLoadController();

  scramjet = new ScramjetController({
    prefix: "/scramjet/",
    files: {
      wasm: "/scramjet.wasm.wasm",
      all: "/scramjet.all.js",
      sync: "/scramjet.sync.js",
    },
  });

  await scramjet.init();

  return scramjet;
}

export function getScramjet() {
  return scramjet;
}