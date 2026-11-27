// DealBoard — the entrypoint for make.fun's black-friday-deal-finder-01
// (Node 22, standard library only). The site itself is the static files in
// app/ beside this file: open app/index.html in a browser and it works, no
// build step, no network. This program only hands the entry in: it copies
// app/ and screenshots/ to the output directory and writes dossier.json
// there — the summary the judge reads (the screenshots, the first load's
// files and bytes, and the source) — using the vendored make.fun library.
// vendor/makefun-frontend.ts is left exactly as the kit shipped it: the
// scorer requires dossier.json to be byte for byte what its own copy of
// that library writes.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the site while developing with `node serve.ts`, then open
// http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/, or 16 MiB of
// app files — app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
