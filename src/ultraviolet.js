import { BareMuxConnection } from "@mercuryworkshop/bare-mux";

let controller = null;

export async function setupBareMux() {
  const connection = new BareMuxConnection("/baremux-worker.js");
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  const websocket = local ? "ws://127.0.0.1:5001/" : `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/`;
  await connection.setTransport("/libcurl.mjs", [{ websocket }]);
  return connection;
}

function waitForWorker(registration) {
  if (registration.active) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const worker = registration.installing || registration.waiting;
    if (!worker) return reject(new Error("Ultraviolet worker was not found."));
    const timeout = setTimeout(() => finish(new Error("Ultraviolet startup timed out.")), 15000);
    function finish(error) {
      clearTimeout(timeout);
      worker.removeEventListener("statechange", check);
      if (error) reject(error); else resolve();
    }
    function check() {
      if (worker.state === "activated") finish();
      else if (worker.state === "redundant") finish(new Error("Ultraviolet worker could not activate."));
    }
    worker.addEventListener("statechange", check);
    check();
  });
}

export async function setupUltraviolet() {
  if (!("serviceWorker" in navigator)) throw new Error("This browser does not support service workers.");
  const config = globalThis.__uv$config;
  if (!config) throw new Error("Ultraviolet scripts did not load.");
  // Retire the previous engine's worker on existing installations.
  for (const registration of await navigator.serviceWorker.getRegistrations()) {
    if (new URL(registration.scope).pathname === "/scramjet/") await registration.unregister();
  }
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: config.prefix });
  await waitForWorker(registration);
  controller = { encodeUrl: url => config.prefix + config.encodeUrl(url) };
  return controller;
}

export function getUltraviolet() { return controller; }
