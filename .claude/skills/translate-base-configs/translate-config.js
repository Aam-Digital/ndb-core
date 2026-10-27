#!/usr/bin/env node
/**
 * Mechanical helper for translating base configs into an additional language.
 *
 * It only walks JSON and moves strings around - it never translates anything.
 * The translation itself is Claude's job, between `extract` and `apply`.
 *
 *   extract  collect every source string that still misses the target locale
 *   apply    write a {source: translation} table back into the configs
 *   check    count coverage and list what is still missing (re-runnable)
 *
 * Run `node translate-config.js` without arguments for usage.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename } from "node:path";

const BASE_CONFIGS_DIR = "src/assets/base-configs";
const AVAILABLE_CONFIGS = join(BASE_CONFIGS_DIR, "available-configs.json");
/** strings longer than this need real care and are listed separately */
const PROSE_LENGTH = 80;

const LOCALE_CODE = /^[a-z]{2}(-[A-Za-z0-9]+)*$/;

/** A translatable map is an object whose keys are all locale codes, including the source one. */
function isTranslationMap(value, sourceLocale) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return (
    keys.includes(sourceLocale) &&
    keys.every((k) => LOCALE_CODE.test(k)) &&
    keys.every((k) => typeof value[k] === "string")
  );
}

/** Calls visit(map, path) for every translation map in the document, depth first. */
function walk(node, sourceLocale, visit, path = "") {
  if (isTranslationMap(node, sourceLocale)) {
    visit(node, path);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, sourceLocale, visit, `${path}[${i}]`));
  } else if (typeof node === "object" && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      walk(value, sourceLocale, visit, path ? `${path}.${key}` : key);
    }
  }
}

/**
 * Inserts the new locale as the second to last key, so no preceding line gains a comma
 * and the diff is nothing but added lines. The last key (usually `ar`) stays last.
 * A map that holds only the source locale gets the new key appended instead.
 */
function insertBeforeLast(map, locale, translation) {
  const keys = Object.keys(map);
  const position = keys.length >= 2 ? keys.length - 1 : keys.length;
  const reordered = {};
  keys.slice(0, position).forEach((k) => (reordered[k] = map[k]));
  reordered[locale] = translation;
  keys.slice(position).forEach((k) => (reordered[k] = map[k]));
  for (const k of Object.keys(map)) delete map[k];
  Object.assign(map, reordered);
}

function insertCodeBeforeLast(codes, locale) {
  if (codes.includes(locale)) return codes;
  const position = codes.length >= 2 ? codes.length - 1 : codes.length;
  return [...codes.slice(0, position), locale, ...codes.slice(position)];
}

// --- file handling ---------------------------------------------------------

function serialize(data, raw) {
  const text = JSON.stringify(data, null, 2) + "\n";
  return raw.includes("\r\n") ? text.replace(/\n/g, "\r\n") : text;
}

function readJson(file) {
  const raw = readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  // Prettier formats JSON with the `json-stringify` parser (see .prettierrc.json),
  // so a re-stringify reproduces the file byte for byte. If it does not, writing the
  // file would reformat it and bury the added keys in an unreviewable diff.
  const reformats = serialize(data, raw) !== raw;
  return { data, raw, reformats };
}

function expandToJsonFiles(target) {
  if (statSync(target).isDirectory()) {
    return readdirSync(target)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(target, f));
  }
  return [target];
}

/** Resolves which files belong to a use case: its entry plus everything it imports. */
function filesOfUseCase(useCaseId) {
  const configs = JSON.parse(readFileSync(AVAILABLE_CONFIGS, "utf8"));
  const useCase = configs.find((c) => c.id === useCaseId);
  if (!useCase) {
    fail(
      `unknown use case "${useCaseId}". Available: ${configs.map((c) => c.id).join(", ")}`,
    );
  }
  const imported = (useCase.entitiesToImport ?? []).map((f) =>
    join(BASE_CONFIGS_DIR, f),
  );
  return [...new Set([AVAILABLE_CONFIGS, ...imported])];
}

function resolveFiles(options) {
  const files = options.useCase
    ? filesOfUseCase(options.useCase)
    : options.paths.flatMap(expandToJsonFiles);
  if (files.length === 0)
    fail("no input files - pass --use-case <id> or paths");
  return files;
}

/**
 * available-configs.json holds the entry of every use case, so walking all of it would
 * report the name and description of unrelated use cases as missing. Narrow it down.
 */
function translatablePart(file, data, options) {
  if (basename(file) !== "available-configs.json" || !options.useCase)
    return data;
  return data.find((c) => c.id === options.useCase) ?? {};
}

const displayPath = (file) => relative(".", file).replace(/\\/g, "/");

// --- commands --------------------------------------------------------------

function extract(options) {
  const byString = new Map();
  let totalMaps = 0;

  for (const file of resolveFiles(options)) {
    const { data } = readJson(file);
    walk(translatablePart(file, data, options), options.source, (map, path) => {
      totalMaps++;
      if (map[options.target] !== undefined) return;
      const source = map[options.source];
      const entry = byString.get(source) ?? {
        source,
        existing: {},
        occurrences: 0,
        paths: [],
      };
      entry.occurrences++;
      entry.paths.push(`${displayPath(file)}:${path}`);
      for (const [locale, value] of Object.entries(map)) {
        if (locale !== options.source) entry.existing[locale] = value;
      }
      byString.set(source, entry);
    });
  }

  const all = [...byString.values()];
  const result = {
    target: options.target,
    totalMaps,
    untranslatedMaps: all.reduce((sum, e) => sum + e.occurrences, 0),
    uniqueStrings: all.length,
    labels: all.filter((e) => e.source.length <= PROSE_LENGTH),
    prose: all.filter((e) => e.source.length > PROSE_LENGTH),
  };
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

function apply(options) {
  if (!options.table) fail("apply needs --table <file.json>");
  const table = JSON.parse(readFileSync(options.table, "utf8"));
  const files = resolveFiles(options);
  if (options.out && files.length !== 1) {
    fail("--out works with a single input file only");
  }

  let applied = 0;
  const untranslated = new Map();
  const invalid = new Set();
  const suspicious = [];

  for (const file of files) {
    const { data, raw, reformats } = readJson(file);
    // Base configs are formatted with prettier's `json-stringify` parser (.prettierrc.json),
    // so re-stringifying them reproduces the file byte for byte and the diff is nothing but
    // added keys. A file that does not match that - a config downloaded from a live instance
    // is one long line - would be reformatted completely, so it may only be written elsewhere.
    if (reformats && !options.out) {
      fail(
        `${displayPath(file)} is not formatted the way prettier writes JSON, so writing it ` +
          `in place would reformat the whole file and bury the added keys in the diff. ` +
          `Pass --out <file> to write the reformatted result to a new file instead.`,
      );
    }
    let changed = 0;

    walk(translatablePart(file, data, options), options.source, (map, path) => {
      if (map[options.target] !== undefined) return;
      const source = map[options.source];
      const translation = Object.hasOwn(table, source)
        ? table[source]
        : undefined;
      if (typeof translation !== "string") {
        if (translation !== undefined) invalid.add(source);
        untranslated.set(source, (untranslated.get(source) ?? 0) + 1);
        return;
      }
      const structure = structureWarning(source, translation);
      if (structure)
        suspicious.push(`${displayPath(file)}:${path} - ${structure}`);
      insertBeforeLast(map, options.target, translation);
      changed++;
      applied++;
      if (options.verbose) console.log(`  ${displayPath(file)}:${path}`);
    });

    if (basename(file) === "available-configs.json" && options.useCase) {
      changed += registerLocale(data, options);
    }

    if (changed > 0 && !options.dryRun) {
      writeFileSync(options.out ?? file, serialize(data, raw));
    }
    console.log(`${displayPath(file)}: ${changed} added`);
  }

  console.log(`\napplied: ${applied}`);
  const missing = [...untranslated.values()].reduce((sum, n) => sum + n, 0);
  console.log(`untranslated: ${missing}`);
  for (const [source, count] of untranslated) {
    const reason = invalid.has(source)
      ? " <-- table entry is not a string"
      : "";
    console.log(`  (${count}x) ${JSON.stringify(source)}${reason}`);
  }
  if (suspicious.length > 0) {
    console.log(`\ncheck by hand: ${suspicious.length}`);
    suspicious.forEach((s) => console.log(`  ${s}`));
  }
  if (options.dryRun) console.log("\n(dry run - nothing written)");
}

/**
 * A missing translation shows up as `untranslated`, but a translation that dropped the
 * markdown structure of a long text applies silently. These two counts are cheap and catch
 * the usual damage: a lost line break and a lost heading or list marker.
 */
function structureWarning(source, translation) {
  const lines = (text) => text.split("\n").length;
  const markers = (text) =>
    (text.match(/^\s*(#+|[-*]|\d+\.)\s/gm) ?? []).length;
  if (lines(source) !== lines(translation)) {
    return `${lines(source)} lines in the source, ${lines(translation)} in the translation`;
  }
  if (markers(source) !== markers(translation)) {
    return `${markers(source)} markdown headings/list markers in the source, ${markers(translation)} in the translation`;
  }
  return undefined;
}

/** Adds the new locale to the `locale` list of the use case in available-configs.json. */
function registerLocale(configs, options) {
  const useCase = configs.find((c) => c.id === options.useCase);
  if (!useCase) return 0;
  const before = useCase.locale;
  if (before === undefined || typeof before === "string") {
    console.log(
      `  note: "${options.useCase}".locale was ${JSON.stringify(before)} - ` +
        `turning it into a list. Review that part of the diff by hand.`,
    );
    useCase.locale = insertCodeBeforeLast(
      before === undefined ? [options.source] : [before],
      options.target,
    );
    return 1;
  }
  if (before.includes(options.target)) return 0;
  useCase.locale = insertCodeBeforeLast(before, options.target);
  return 1;
}

function check(options) {
  let withSource = 0;
  let withTarget = 0;
  const missing = [];

  for (const file of resolveFiles(options)) {
    const { data } = readJson(file);
    walk(translatablePart(file, data, options), options.source, (map, path) => {
      withSource++;
      if (map[options.target] !== undefined) withTarget++;
      else
        missing.push(`${displayPath(file)}:${path} - ${map[options.source]}`);
    });
  }

  console.log(`maps with ${options.source}: ${withSource}`);
  console.log(`maps with ${options.target}: ${withTarget}`);
  console.log(`missing ${options.target}: ${missing.length}`);
  missing.slice(0, 20).forEach((m) => console.log(`  ${m}`));
  if (missing.length > 20) console.log(`  ... and ${missing.length - 20} more`);

  if (options.useCase) {
    const configs = JSON.parse(readFileSync(AVAILABLE_CONFIGS, "utf8"));
    const locale = configs.find((c) => c.id === options.useCase)?.locale;
    const listed = Array.isArray(locale) && locale.includes(options.target);
    console.log(
      `\n"${options.useCase}".locale: ${JSON.stringify(locale)}` +
        (listed ? "" : `  <-- ${options.target} not listed yet`),
    );
    if (!listed) process.exitCode = 1;
  }

  if (missing.length > 0) process.exitCode = 1;
}

// --- cli -------------------------------------------------------------------

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(2);
}

const USAGE = `
usage: node translate-config.js <extract|apply|check> --target <locale> [options]

  --target <locale>    locale to add, e.g. es (required)
  --source <locale>    locale to translate from (default: en-US)
  --use-case <id>      resolve files through available-configs.json, e.g. education
  <paths...>           files or directories to use instead of --use-case
  --table <file>       apply: the {source: translation} table
  --out <file>         apply: write to this file instead of in place (single input)
  --dry-run            apply: report what would change, write nothing
  --verbose            apply: print every map that was changed

examples:
  node translate-config.js extract --target es --use-case education > strings.json
  node translate-config.js apply --target es --use-case education --table table.json
  node translate-config.js check --target es --use-case education
`;

function parseArgs(argv) {
  const options = { source: "en-US", paths: [] };
  const flags = {
    "--target": "target",
    "--source": "source",
    "--use-case": "useCase",
    "--table": "table",
    "--out": "out",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (flags[arg]) options[flags[arg]] = argv[++i];
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--verbose") options.verbose = true;
    else if (arg.startsWith("--")) fail(`unknown option ${arg}`);
    else options.paths.push(arg);
  }
  return options;
}

const [command, ...argv] = process.argv.slice(2);
const commands = { extract, apply, check };
if (!commands[command]) {
  console.error(USAGE);
  process.exit(2);
}
const options = parseArgs(argv);
if (!options.target) fail("--target <locale> is required");
if (
  options.useCase &&
  !statSync(AVAILABLE_CONFIGS, { throwIfNoEntry: false })
) {
  fail(
    `--use-case has to run from the repository root (${AVAILABLE_CONFIGS} not found)`,
  );
}
commands[command](options);
