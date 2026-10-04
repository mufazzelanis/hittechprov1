#!/usr/bin/env node
// Wrapper around the Prisma CLI that always points --schema at THIS project's schema file by absolute
// path, computed from npm's own INIT_CWD (the directory `npm install`/`npm run` was invoked from).
//
// Why this exists: some hosts (seen on a cPanel/CloudLinux Node.js Selector setup) run npm lifecycle
// scripts (postinstall, etc.) with process.cwd() pointed at the Node version manager's own internal
// folder, not the project root - so prisma's default cwd-relative schema lookup, and even an explicit
// relative --schema=./prisma/schema.prisma, silently fails to find the schema. Resolving the path in
// plain Node, from INIT_CWD, sidesteps that entirely - and unlike shell syntax ($VAR vs %VAR%), it
// behaves the same on Windows and Linux.
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.env.INIT_CWD || process.cwd();
const schema = path.join(root, "prisma", "schema.prisma");
const bin = process.platform === "win32" ? "prisma.cmd" : "prisma";
const args = [...process.argv.slice(2), "--schema", schema];

const result = spawnSync(bin, args, { stdio: "inherit", shell: process.platform === "win32" });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
