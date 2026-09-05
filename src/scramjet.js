import { BareMuxConnection } from "@mercuryworkshop/bare-mux";

let scramjet = null;

const SCRAMJET_DB_NAME =
  "$scramjet";

const SCRAMJET_STORES = [
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

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function unregisterScramjetServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registrations =
    await navigator.serviceWorker.getRegistrations();

  for (const registration of registrations) {
    if (
      registration.scope.includes(
        "/scramjet/"
      )
    ) {
      await registration.unregister();
    }
  }
}

function deleteScramjetDatabase() {
  return new Promise(
    (resolve, reject) => {
      const request =
        indexedDB.deleteDatabase(
          SCRAMJET_DB_NAME
        );

      const timeout =
        setTimeout(() => {
          reject(
            new Error(
              "Timed out deleting broken Scramjet database."
            )
          );
        }, 10000);

      request.onsuccess = () => {
        clearTimeout(timeout);
        resolve();
      };

      request.onerror = () => {
        clearTimeout(timeout);

        reject(
          request.error ||
            new Error(
              "Could not delete broken Scramjet database."
            )
        );
      };

      request.onblocked = () => {
        console.warn(
          "Waiting for old Scramjet database connections to close..."
        );
      };
    }
  );
}

function createScramjetDatabase() {
  return new Promise(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          SCRAMJET_DB_NAME,
          1
        );

      request.onupgradeneeded =
        () => {
          const db =
            request.result;

          for (
            const storeName
            of SCRAMJET_STORES
          ) {
            if (
              !db.objectStoreNames.contains(
                storeName
              )
            ) {
              db.createObjectStore(
                storeName
              );
            }
          }
        };

      request.onsuccess = () => {
        const db =
          request.result;

        const stores =
          [...db.objectStoreNames];

        const valid =
          SCRAMJET_STORES.every(
            (storeName) =>
              stores.includes(
                storeName
              )
          );

        db.close();

        if (!valid) {
          reject(
            new Error(
              "Scramjet database schema is incomplete."
            )
          );

          return;
        }

        resolve();
      };

      request.onerror = () => {
        reject(
          request.error ||
            new Error(
              "Could not initialize Scramjet database."
            )
        );
      };
    }
  );
}

async function ensureScramjetDatabase() {
  let existingDatabase = null;

  if (
    typeof indexedDB.databases ===
    "function"
  ) {
    const databases =
      await indexedDB.databases();

    existingDatabase =
      databases.find(
        (database) =>
          database.name ===
          SCRAMJET_DB_NAME
      );
  }

  /*
    If the database does not exist, create it ourselves
    with the exact schema Scramjet's controller expects.

    This prevents ScramjetServiceWorker from winning the
    startup race and creating an empty version-1 database.
  */
  if (!existingDatabase) {
    await createScramjetDatabase();

    console.log(
      "Scramjet IndexedDB initialized."
    );

    return;
  }

  /*
    The database already exists.

    Opening it here is safe because indexedDB.databases()
    has already confirmed that it exists, so this call
    cannot accidentally manufacture an empty database.
  */
  const schemaValid =
    await new Promise(
      (resolve, reject) => {
        const request =
          indexedDB.open(
            SCRAMJET_DB_NAME
          );

        request.onsuccess =
          () => {
            const db =
              request.result;

            const stores =
              [...db.objectStoreNames];

            const valid =
              SCRAMJET_STORES.every(
                (storeName) =>
                  stores.includes(
                    storeName
                  )
              );

            db.close();

            resolve(valid);
          };

        request.onerror =
          () => {
            reject(
              request.error
            );
          };
      }
    );

  if (schemaValid) {
    return;
  }

  console.warn(
    "Broken Scramjet IndexedDB detected. Rebuilding schema..."
  );

  await unregisterScramjetServiceWorker();

  /*
    Give any old worker instance a moment to release
    its IndexedDB connection before deletion.
  */
  await wait(500);

  await deleteScramjetDatabase();

  await createScramjetDatabase();

  console.log(
    "Scramjet IndexedDB schema rebuilt."
  );
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

  /*
    IMPORTANT:
    Build/repair the IndexedDB schema BEFORE registering
    Scramjet's service worker.

    Scramjet v1's worker constructor opens $scramjet
    without an upgrade callback. If it opens the DB first,
    Chromium creates version 1 with zero stores.

    Initializing it here removes that race.
  */
  await ensureScramjetDatabase();

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

  await controller.init();

  scramjet = controller;

  return scramjet;
}

export function getScramjet() {
  return scramjet;
}