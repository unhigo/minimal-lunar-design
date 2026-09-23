#!/usr/bin/env node
/**
 * seed-tools.mjs — One-shot idempotent import of the curated tool catalog
 * into the Convex `tools` table.
 *
 * Usage:  node scripts/seed-tools.mjs
 * Env:    VITE_CONVEX_URL (read from .env files if not exported)
 *
 * Idempotent: server-side guard no-ops when any tool already exists, so
 * re-running is always safe.
 */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// Load the curated catalog from the TS source without a build step.
// ---------------------------------------------------------------------------

function loadCatalog() {
  const source = readFileSync(resolve(root, "src/data/tools.ts"), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const fn = new Function("exports", "require", "module", "__filename", "__dirname", js);
  fn(module.exports, require, module, "tools.ts", root);
  return module.exports;
}

const { TOOLS } = loadCatalog();
if (!Array.isArray(TOOLS) || TOOLS.length === 0) {
  console.error("[x] No tools found in src/data/tools.ts");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Convex URL
// ---------------------------------------------------------------------------

function convexUrl() {
  if (process.env.VITE_CONVEX_URL) return process.env.VITE_CONVEX_URL;
  for (const f of [".env", ".env.local", ".env.development", ".env.development.local"]) {
    try {
      const raw = readFileSync(resolve(root, f), "utf8");
      const m = raw.match(/^VITE_CONVEX_URL=(.+)$/m);
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    } catch {
      // try next file
    }
  }
  console.error("[x] VITE_CONVEX_URL not set — cannot reach Convex.");
  process.exit(1);
}

const url = convexUrl();
console.log(`→ Convex: ${url}`);

// ---------------------------------------------------------------------------
// Seed via the public HTTP API (mutation api.tools.seedFromCatalog)
// ---------------------------------------------------------------------------

const payload = TOOLS.map((t) => ({
  name: t.name,
  shortDescription: t.shortDescription,
  description: t.description,
  website: t.website,
  category: t.category,
  tags: t.tags,
  pricing: t.pricing,
  pricingDetails: t.pricingDetails,
  platforms: t.platforms,
  features: t.features,
  verified: t.verified,
  featured: t.featured,
  trending: t.trending,
  createdAt: t.createdAt,
}));

async function main() {
  const res = await fetch(`${url.replace(/\/+$/, "")}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "tools:seedFromCatalog",
      args: { tools: payload },
      format: "json",
    }),
  });
  if (!res.ok) {
    console.error(`[x] Convex API ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const json = await res.json();
  if (json.success === false) {
    console.error(`[x] Mutation failed: ${json.errorMessage ?? JSON.stringify(json)}`);
    process.exit(1);
  }
  const value = json.value ?? json.result;
  if (value?.skipped) {
    console.log("OK catalogo ya sembrado - no-op (idempotente).");
  } else {
    console.log(`OK ${value?.inserted ?? payload.length} herramientas insertadas en la base de datos.`);
  }
}

main().catch((err) => {
  console.error("[x]", err?.message ?? err);
  process.exit(1);
});
