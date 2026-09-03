import {
  ScramjetServiceWorker,
  setConfig,
  loadCodecs,
} from "/scramjet.bundle.js";

const SCRAMJET_DB_NAME = "$scramjet";

const SCRAMJET_REQUIRED_STORES = [
  "config",
  "cookies",
  "redirectTrackers",
  "referrerPolicies",
  "publicSuffixList",
];

function deleteScramjetDatabase() {
  return new Promise((resolve, reject) => {
    const request =
      indexedDB.deleteDatabase(SCRAMJET_DB_NAME);

    request.onsuccess = () => {
      console.log(
        "Service worker removed invalid Scramjet database."
      );

      resolve();
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error(
            "Service worker could not delete Scramjet database."
          )
      );
    };

    request.onblocked = () => {
      console.warn(
        "Service worker Scramjet database deletion blocked."
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
            "Service worker could not inspect Scramjet database."
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
  try {
    const {
      databaseWasCreated,
      missingStores,
    } = await inspectScramjetDatabase();

    if (
      databaseWasCreated ||
      missingStores.length > 0
    ) {
      if (missingStores.length > 0) {
        console.warn(
          "Service worker found invalid Scramjet schema:",
          missingStores
        );
      }

      await deleteScramjetDatabase();
    }
  } catch (error) {
    console.warn(
      "Service worker Scramjet database preflight failed:",
      error
    );
  }
}

/*
 * Do the database check BEFORE constructing
 * ScramjetServiceWorker.
 */
await repairScramjetDatabase();

const scramjet =
  new ScramjetServiceWorker();

let initializedConfig = null;
let configReadyPromise = null;

async function ensureScramjetConfig() {
  if (scramjet.config) {
    if (
      initializedConfig !==
      scramjet.config
    ) {
      setConfig(scramjet.config);

      await loadCodecs();

      initializedConfig =
        scramjet.config;
    }

    return true;
  }

  if (!configReadyPromise) {
    configReadyPromise =
      (async () => {
        try {
          await scramjet.loadConfig();

          if (!scramjet.config) {
            return false;
          }

          setConfig(scramjet.config);

          await loadCodecs();

          initializedConfig =
            scramjet.config;

          return true;
        } catch (error) {
          console.error(
            "Scramjet service worker config failed:",
            error
          );

          return false;
        }
      })();
  }

  return configReadyPromise;
}

self.addEventListener(
  "fetch",
  (event) => {
    event.respondWith(
      (async () => {
        const ready =
          await ensureScramjetConfig();

        if (!ready) {
          return fetch(event.request);
        }

        if (scramjet.route(event)) {
          return scramjet.fetch(event);
        }

        return fetch(event.request);
      })()
    );
  }
);