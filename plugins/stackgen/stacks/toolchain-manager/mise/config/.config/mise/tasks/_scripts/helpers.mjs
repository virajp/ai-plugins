#!/usr/bin/env node

// MISE description="Helper functions for Node-based mise tasks"
// MISE hide=true

// The `.mjs` mirror of `_scripts/helpers`. A task written in Node imports from
// here instead of sourcing the bash file, and prints identically — same names,
// same colours, same baked-in separators — so a repo whose task library is half
// bash and half Node still reads as one surface.
//
// Keep the two in step. A printer added to one and not the other is how the
// vocabularies drift, and the drift is invisible until someone reads two tasks
// side by side.

import { spawnSync } from "node:child_process";

// Style
const BOLD = "\x1B[1m";
const NORMAL = "\x1B[0m";
// Colors
const GREEN = "\x1B[0;32m";
const YELLOW = "\x1B[0;33m";
const RED = "\x1B[0;31m";
export const BLUE = "\x1B[0;34m";

/**
 * A full-width separator line built from the given character.
 * @param {string} char
 */
export function line_sep(char = "=") {
  const columns = process.stdout.columns || 80;
  process.stdout.write(`${char.repeat(columns)}\n`);
}

/**
 * A major section: a full-width `=` rule, then the title.
 * @param {string} msg
 */
export function print_header(msg) {
  line_sep("=");
  process.stdout.write(`${GREEN}${BOLD}${msg}${NORMAL}\n`);
}

/**
 * A step inside a section: a full-width `-` rule, then the title.
 * @param {string} msg
 */
export function print_subheader(msg) {
  line_sep("-");
  process.stdout.write(`${GREEN}${BOLD}${msg}${NORMAL}\n`);
}

/** @param {string} msg */
export function print_success(msg) {
  process.stdout.write(`${GREEN}${BOLD}${msg}${NORMAL}\n`);
}

export function print_ok() {
  process.stdout.write(`${GREEN}${BOLD}OK${NORMAL}\n`);
}

/** @param {string} msg */
export function print_wait(msg) {
  process.stdout.write(`${YELLOW}${BOLD}${msg}${NORMAL}`);
}

/** @param {string} msg */
export function print_warn(msg) {
  process.stdout.write(`${YELLOW}${BOLD}${msg}${NORMAL}\n`);
}

/** @param {string} msg */
export function print_yellow(msg) {
  process.stdout.write(`${YELLOW}${msg}${NORMAL}\n`);
}

export function print_newline() {
  process.stdout.write("\n");
}

/** Errors go to stderr, matching the bash library. @param {string} msg */
export function print_error(msg) {
  process.stderr.write(`${RED}${BOLD}${msg}${NORMAL}\n`);
}

/**
 * Run a command, inheriting stdio, and exit this task with its status when it
 * fails. The bash library needs no equivalent — `set -e` is it.
 *
 * @param {string} cmd
 * @param {string[]} args
 */
export function run(cmd, args = []) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });

  if (result.error) {
    print_error(`Failed to spawn: ${cmd}`);
    print_error(result.error.message);
    process.exit(1);
  }

  if (result.signal) {
    print_error(`${cmd} was killed by signal ${result.signal}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    print_error(`${cmd} exited with code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}
