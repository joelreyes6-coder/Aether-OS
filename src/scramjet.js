import { BareMuxConnection } from "@mercuryworkshop/bare-mux";

let scramjet = null;

const SCRAMJET_DB_NAME = "$scramjet";

const SCRAMJET_REQUIRED_STORES = [
  "config",
  "cookies",
  "redirectTrackers",
  "referrerPolicies",
  "publicSuffixList",
];

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

function deleteScramjetDatabase() {
  return new Promise((resolve, reject) => {
    const request =
      indexedDB.deleteDatabase(SCRAMJET_DB_NAME);

    request.onsuccess = () => {
      console.log(
        "Removed invalid Scramjet IndexedDB database."
      );

      resolve();
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error(
            "Could not delete invalid Scramjet database."
          )
      );
    };

    request.onblocked = () => {
      console.warn(
        "Scramjet database deletion is temporarily blocked."
      );
    };
  });
}

function inspectScramjetDatabase() {
  return new Promise((resolve, reject) => {
    let databaseWasCreated = false;

    const request =
      indexedDB.open(SCRAMJET_DB_NAME);

    request.onupgradeneeded = (event) => {
      if (event.oldVersion === 0) {
        databaseWasCreated = true;
      }
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error(
            "Could not inspect Scramjet database."
          )
      );
    };

    request.onsuccess = () => {
      const database = request.result;

      const missingStores =
        SCRAMJET_REQUIRED_STORES.filter(
          (storeName) =>
            !database.objectStoreNames.contains(
              storeName
            )
        );

      database.close();

      resolve({
        databaseWasCreated,
        missingStores,
      });
    };
  });
}

async function repairScramjetDatabase() {
  if (!("indexedDB" in window)) {
    return;
  }

  try {
    const {
      databaseWasCreated,
      missingStores,
    } = await inspectScramjetDatabase();

    /*
     * If our inspection created the database, it is
     * empty and Scramjet needs to create its own
     * correctly structured database.
     *
     * If an existing database is missing any required
     * stores, remove it so Scramjet can rebuild it.
     */
    if (
      databaseWasCreated ||
      missingStores.length > 0
    ) {
      if (missingStores.length > 0) {
        console.warn(
          "Invalid Scramjet IndexedDB schema. Missing:",
          missingStores
        );
      }

      await deleteScramjetDatabase();
    }
  } catch (error) {
    console.warn(
      "Scramjet IndexedDB preflight failed:",
      error
    );
  }
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

  /*
   * IMPORTANT:
   * Repair the database BEFORE registering /
   * initializing Scramjet.
   */
  await repairScramjetDatabase();

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

  await controller.init();

  scramjet = controller;

  return scramjet;
}

export function getScramjet() {
  return scramjet;
}