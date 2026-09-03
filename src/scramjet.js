import { BareMuxConnection } from "@mercuryworkshop/bare-mux";

let scramjet = null;

const SCRAMJET_DB_NAME = "$scramjet";
const SCRAMJET_REPAIR_KEY =
  "my-os-scramjet-repair-attempted";

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

  const name = String(error.name || "");
  const message = String(error.message || "");

  return (
    name === "NotFoundError" &&
    message
      .toLowerCase()
      .includes("object store")
  );
}

async function unregisterScramjetServiceWorkers() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registrations =
    await navigator.serviceWorker.getRegistrations();

  for (const registration of registrations) {
    const scope = registration.scope || "";

    if (scope.includes("/scramjet/")) {
      console.warn(
        "Unregistering broken Scramjet service worker."
      );

      await registration.unregister();
    }
  }
}

function deleteScramjetDatabase() {
  return new Promise((resolve, reject) => {
    const request =
      indexedDB.deleteDatabase(SCRAMJET_DB_NAME);

    let finished = false;

    const timeout = setTimeout(() => {
      if (finished) {
        return;
      }

      finished = true;

      reject(
        new Error(
          "Timed out deleting the Scramjet database."
        )
      );
    }, 5000);

    request.onsuccess = () => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeout);

      console.log(
        "Broken Scramjet IndexedDB database deleted."
      );

      resolve();
    };

    request.onerror = () => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeout);

      reject(
        request.error ||
          new Error(
            "Could not delete the broken Scramjet database."
          )
      );
    };

    request.onblocked = () => {
      console.warn(
        "Scramjet database deletion is blocked. Waiting for existing connections to close."
      );
    };
  });
}

async function repairBrokenScramjetDatabase() {
  /*
   * Only repair once per browser session.
   * This prevents an infinite reload loop if
   * something other than IndexedDB is broken.
   */
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

  console.warn(
    "Scramjet has a broken IndexedDB schema. Starting automatic repair."
  );

  await unregisterScramjetServiceWorkers();

  await deleteScramjetDatabase();

  console.log(
    "Scramjet repair complete. Reloading Aether OS."
  );

  window.location.reload();

  return true;
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

  await connection.setTransport(
    "/libcurl.mjs",
    [
      {
        websocket: getWispUrl(),
      },
    ]
  );

  return connection;
}

export async function setupScramjet() {
  if (!("serviceWorker" in navigator)) {
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

  await waitForServiceWorker(registration);

  if (!globalThis.$scramjetLoadController) {
    throw new Error(
      "Scramjet bundle did not load."
    );
  }

  const { ScramjetController } =
    globalThis.$scramjetLoadController();

  const controller =
    new ScramjetController({
      prefix: "/scramjet/",

      files: {
        wasm: "/scramjet.wasm.wasm",
        all: "/scramjet.all.js",
        sync: "/scramjet.sync.js",
      },
    });

  try {
    await controller.init();
  } catch (error) {
    if (isMissingObjectStoreError(error)) {
      try {
        const repairing =
          await repairBrokenScramjetDatabase();

        if (repairing) {
          return null;
        }
      } catch (repairError) {
        console.error(
          "Automatic Scramjet repair failed:",
          repairError
        );
      }
    }

    throw error;
  }

  /*
   * Successful initialization means the database is
   * healthy again. Clear the loop guard so a future
   * genuine corruption can also be repaired.
   */
  sessionStorage.removeItem(
    SCRAMJET_REPAIR_KEY
  );

  scramjet = controller;

  return scramjet;
}

export function getScramjet() {
  return scramjet;
}