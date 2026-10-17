import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";

const target = resolve("public/uv");
await mkdir(target, { recursive: true });
for (const file of ["uv.bundle.js", "uv.client.js", "uv.handler.js", "uv.sw.js"]) {
  await copyFile(resolve(uvPath, file), resolve(target, file));
}
await copyFile(resolve(uvPath, "../LICENSE"), resolve(target, "LICENSE"));
