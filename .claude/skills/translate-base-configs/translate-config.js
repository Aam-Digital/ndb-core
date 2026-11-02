#!/usr/bin/env node
/**
 * Mechanical helper for translating base configs into an additional language.
 *
 * It only walks JSON and moves strings around - it never translates anything.
 * The translation itself is Claude's job, between `extract` and `apply`.
 *
 *   extract  write every text that still misses the target locale into batch files
 *   apply    write {location: translation} tables back into the configs
 *   check    count coverage and list what is still missing (re-runnable)
 *
 * Run `node translate-config.js` without arguments for usage.
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  mkdirSync,
} from "node:fs";
import { createRequire } from "node:module";
import { join, relative, basename } from "node:path";

// jsonc-parser edits the text of a file in place, so whatever formatting it has is kept
// and the diff holds nothing but the added translations.
const { modify, applyEdits } = createRequire(import.meta.url)("jsonc-parser");

const BASE_CONFIGS_DIR = "src/assets/base-configs";
const AVAILABLE_CONFIGS = join(BASE_CONFIGS_DIR, "available-configs.json");
/** strings longer than this need real care and are listed separately */
const PROSE_LENGTH = 80;
/** size of one batch file in characters, so it can be read and translated in one go */
const BATCH_CHARS = 40_000;
const BATCH_FILE = /^(labels|prose)-\d+\.json$/;

const LOCALE_CODE = /^[a-z]{2}(-[A-Za-z0-9]+)*$/;

/**
 * Properties that hold a user-visible text, as `TranslatableTextProperty` in
 * src/app/core/config/multi-lingual-config.ts. Used to find texts that are still a
 * plain string instead of a translation map.
 */
const TEXT_PROPERTIES = [
  "label",
  "labelShort",
  "labelPlural",
  "description",
  "title",
  "header",
];
/** the texts of a use case entry in available-configs.json */
const USE_CASE_TEXT_PROPERTIES = ["name", "description"];
/** objects whose `title` names a field instead of holding a text */
const FIELD_REFERENCES = ["toBlockDetailsAttributes", "fieldMapping"];

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

/**
 * Calls visit(map, segments, ancestors) for every translation map in the document, depth
 * first. `segments` is the path to the map, `ancestors` are the objects around it, the
 * one holding it last.
 */
function walk(node, sourceLocale, visit, segments = [], ancestors = []) {
  if (isTranslationMap(node, sourceLocale)) {
    visit(node, segments, ancestors);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) =>
      walk(item, sourceLocale, visit, [...segments, i], ancestors),
    );
  } else if (typeof node === "object" && node !== null) {
    const inner = [...ancestors, node];
    for (const [key, value] of Object.entries(node)) {
      walk(value, sourceLocale, visit, [...segments, key], inner);
    }
  }
}

/**
 * Calls visit(parent, key, segments, ancestors) for every text property that holds a
 * plain string instead of a translation map. The objects in FIELD_REFERENCES are skipped:
 * their `title` is a field id, and turning it into a map breaks the config. `ancestors`
 * are the objects around `parent`, without `parent` itself.
 */
function walkPlainTexts(
  node,
  properties,
  visit,
  segments = [],
  ancestors = [],
) {
  if (Array.isArray(node)) {
    node.forEach((item, i) =>
      walkPlainTexts(item, properties, visit, [...segments, i], ancestors),
    );
  } else if (typeof node === "object" && node !== null) {
    const inner = [...ancestors, node];
    for (const [key, value] of Object.entries(node)) {
      if (FIELD_REFERENCES.includes(key)) continue;
      const childSegments = [...segments, key];
      if (
        properties.includes(key) &&
        typeof value === "string" &&
        value.trim()
      ) {
        visit(node, key, childSegments, ancestors);
      } else {
        walkPlainTexts(value, properties, visit, childSegments, inner);
      }
    }
  }
}

/** Writes a path the way locations show it, e.g. `[0].data.entity:Child.label`. */
const pathOf = (segments) =>
  segments
    .map((s, i) => (typeof s === "number" ? `[${s}]` : i === 0 ? s : `.${s}`))
    .join("");

/**
 * Names the objects around a text - the document `_id`, then e.g. the label of the
 * entity or the title of the panel - so the translation does not rely on the path alone.
 * Of the object holding the text only the `_id` counts: its label is usually this text.
 */
function contextOf(ancestors, holder, sourceLocale) {
  const textOf = (value) =>
    typeof value === "string"
      ? value
      : isTranslationMap(value, sourceLocale)
        ? value[sourceLocale]
        : undefined;
  return ancestors
    .map(
      (o) =>
        o._id ??
        textOf(o.label) ??
        textOf(o.title) ??
        textOf(o.header) ??
        textOf(o.name),
    )
    .concat(holder._id ?? [])
    .filter((name) => typeof name === "string" && name.trim());
}

const textPropertiesOf = (file) =>
  basename(file) === "available-configs.json"
    ? USE_CASE_TEXT_PROPERTIES
    : TEXT_PROPERTIES;

/**
 * The new key goes in as the second to last one, so no preceding line gains a comma and
 * the diff is nothing but added lines. The last key (usually `ar`) stays last. A map that
 * holds only the source locale gets the new key appended instead.
 */
const beforeLast = (count) => (count >= 2 ? count - 1 : count);

// --- file handling ---------------------------------------------------------

function readJson(file) {
  const raw = readFileSync(file, "utf8");
  return { data: JSON.parse(raw), raw };
}

/** jsonc-parser formats the text it inserts, so it has to know how the file is indented. */
function formattingOf(raw) {
  const indent = raw.match(/^[ \t]+(?=\S)/m)?.[0] ?? "  ";
  const tabs = indent.startsWith("\t");
  return {
    insertSpaces: !tabs,
    tabSize: tabs ? 4 : indent.length,
    eol: raw.includes("\r\n") ? "\r\n" : "\n",
  };
}

/**
 * Applies the edits one after the other, each on the result of the one before, because
 * every edit moves the offsets of everything after it.
 */
function applyToText(raw, edits) {
  const formattingOptions = formattingOf(raw);
  return edits.reduce(
    (text, { segments, value, insertAt, isArrayInsertion }) =>
      applyEdits(
        text,
        modify(text, segments, value, {
          formattingOptions,
          isArrayInsertion,
          getInsertionIndex: insertAt,
        }),
      ),
    raw,
  );
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
 * `prefix` is the path of that part within the file; locations leave it out.
 */
function translatablePart(file, data, options) {
  if (basename(file) !== "available-configs.json" || !options.useCase)
    return { part: data, prefix: [] };
  const index = data.findIndex((c) => c.id === options.useCase);
  return index < 0
    ? { part: {}, prefix: [] }
    : { part: data[index], prefix: [index] };
}

const displayPath = (file) => relative(".", file).replace(/\\/g, "/");

/**
 * Identifies one text in one file - the key of the translation table. It does not change
 * when the target locale is added or a plain string becomes a map, so it stays valid
 * across re-runs.
 */
const locationOf = (file, segments) =>
  `${displayPath(file)}:${pathOf(segments)}`;

/** Sorts by source text, so the occurrences of the same text sit next to each other. */
const bySource = (a, b) =>
  a.source.localeCompare(b.source) || a.location.localeCompare(b.location);

// --- commands --------------------------------------------------------------

/**
 * Lists every occurrence on its own instead of merging identical source texts: the same
 * English word can need different translations in different places.
 */
function extract(options) {
  if (!options.outDir) fail("extract needs --out-dir <directory>");
  mkdirSync(options.outDir, { recursive: true });
  const stale = readdirSync(options.outDir).filter((f) => BATCH_FILE.test(f));
  if (stale.length > 0) {
    fail(
      `${options.outDir} already holds batch files (${stale.join(", ")}) - use a new directory`,
    );
  }

  const entries = [];
  let totalMaps = 0;
  let plainTexts = 0;

  for (const file of resolveFiles(options)) {
    const { data } = readJson(file);
    const { part } = translatablePart(file, data, options);
    walk(part, options.source, (map, segments, ancestors) => {
      totalMaps++;
      if (map[options.target] !== undefined) return;
      const { [options.source]: source, ...existing } = map;
      entries.push({
        location: locationOf(file, segments),
        source,
        existing,
        context: contextOf(
          ancestors.slice(0, -1),
          ancestors.at(-1) ?? {},
          options.source,
        ),
      });
    });
    walkPlainTexts(
      part,
      textPropertiesOf(file),
      (parent, key, segments, ancestors) => {
        plainTexts++;
        entries.push({
          location: locationOf(file, segments),
          source: parent[key],
          plain: true,
          context: contextOf(ancestors, parent, options.source),
        });
      },
    );
  }

  entries.sort(bySource);
  const kinds = {
    labels: entries.filter((e) => e.source.length <= PROSE_LENGTH),
    prose: entries.filter((e) => e.source.length > PROSE_LENGTH),
  };

  console.log(
    `maps: ${totalMaps}, without ${options.target}: ${entries.length - plainTexts}`,
  );
  console.log(`plain strings: ${plainTexts}`);
  for (const [kind, list] of Object.entries(kinds)) {
    const batches = toBatches(list);
    console.log(
      `\n${kind}: ${list.length} in ${batches.length} batch${batches.length === 1 ? "" : "es"}`,
    );
    batches.forEach((batch, i) => {
      const name = `${kind}-${String(i + 1).padStart(2, "0")}.json`;
      writeFileSync(
        join(options.outDir, name),
        JSON.stringify(batch, null, 2) + "\n",
      );
      console.log(`  ${join(options.outDir, name)}: ${batch.length}`);
    });
  }
}

/**
 * Cuts the sorted entries into batches of about BATCH_CHARS. The occurrences of one
 * English text stay in the same batch, so they can be translated consistently.
 */
function toBatches(entries) {
  const batches = [];
  let current = [];
  let size = 0;
  for (let i = 0; i < entries.length;) {
    let end = i;
    while (end < entries.length && entries[end].source === entries[i].source)
      end++;
    const run = entries.slice(i, end);
    const runSize = JSON.stringify(run, null, 2).length;
    if (current.length > 0 && size + runSize > BATCH_CHARS) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(...run);
    size += runSize;
    i = end;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/** Reads one table, or every `*.table.json` of a directory into one. */
function readTables(path) {
  const files = statSync(path).isDirectory()
    ? readdirSync(path)
        .filter((f) => f.endsWith(".table.json"))
        .map((f) => join(path, f))
    : [path];
  if (files.length === 0) fail(`no *.table.json in ${path}`);
  const table = {};
  for (const file of files) {
    for (const [location, translation] of Object.entries(
      JSON.parse(readFileSync(file, "utf8")),
    )) {
      if (Object.hasOwn(table, location) && table[location] !== translation) {
        fail(`${location} has different translations in two tables`);
      }
      table[location] = translation;
    }
  }
  return table;
}

function apply(options) {
  if (!options.table) fail("apply needs --table <file.json or directory>");
  const table = readTables(options.table);
  const files = resolveFiles(options);
  if (options.out && files.length !== 1) {
    fail("--out works with a single input file only");
  }

  // Read every file before writing any, so a failure cannot leave a run half applied.
  const loaded = files.map((file) => ({ file, ...readJson(file), edits: [] }));

  const used = new Set();
  const translationOf = (location) => {
    if (!Object.hasOwn(table, location)) return undefined;
    used.add(location);
    return table[location];
  };
  const notAString = (translation) =>
    translation !== undefined ? " <-- table entry is not a string" : "";
  const untranslated = [];
  const suspicious = [];
  const keptPlain = [];
  const fieldLabels = [];
  let applied = 0;

  const add = (entry, segments, source, translation, edit) => {
    const structure = structureWarning(source, translation);
    if (structure)
      suspicious.push(`${locationOf(entry.file, segments)} - ${structure}`);
    entry.edits.push(edit);
    applied++;
    if (options.verbose) console.log(`  ${locationOf(entry.file, segments)}`);
  };

  for (const entry of loaded) {
    const { file, data } = entry;
    const { part, prefix } = translatablePart(file, data, options);

    walk(part, options.source, (map, segments) => {
      const source = map[options.source];
      if (map[options.target] !== undefined) {
        fieldLabels.push({
          file,
          segments,
          source,
          translation: map[options.target],
        });
        return;
      }
      const location = locationOf(file, segments);
      const translation = translationOf(location);
      if (typeof translation !== "string") {
        untranslated.push(
          `${location} - ${JSON.stringify(source)}${notAString(translation)}`,
        );
        return;
      }
      fieldLabels.push({ file, segments, source, translation });
      add(entry, segments, source, translation, {
        segments: [...prefix, ...segments, options.target],
        value: translation,
        insertAt: (keys) => beforeLast(keys.length),
      });
    });

    // A plain string is only turned into a map when the table has it: a text property can
    // still hold an identifier that FIELD_REFERENCES does not know about.
    walkPlainTexts(part, textPropertiesOf(file), (parent, key, segments) => {
      const source = parent[key];
      const location = locationOf(file, segments);
      const translation = translationOf(location);
      if (typeof translation !== "string") {
        keptPlain.push(
          `${location} - ${JSON.stringify(source)}${notAString(translation)}`,
        );
        return;
      }
      fieldLabels.push({ file, segments, source, translation });
      add(entry, segments, source, translation, {
        segments: [...prefix, ...segments],
        value: { [options.source]: source, [options.target]: translation },
      });
    });
  }

  const missing = untranslated.length;
  // Registering the locale offers the use case in that language, so it waits for a full run.
  const useCaseEntry =
    options.useCase &&
    loaded.find((f) => basename(f.file) === "available-configs.json");
  if (useCaseEntry && missing === 0) {
    useCaseEntry.edits.push(...registerLocale(useCaseEntry.data, options));
  }

  for (const { file, raw, edits } of loaded) {
    if (edits.length > 0 && !options.dryRun) {
      writeFileSync(options.out ?? file, applyToText(raw, edits));
    }
    console.log(`${displayPath(file)}: ${edits.length} added`);
  }

  console.log(`\napplied: ${applied}`);
  console.log(`untranslated: ${missing}`);
  untranslated.forEach((u) => console.log(`  ${u}`));
  if (useCaseEntry && missing > 0) {
    console.log(
      `  "${options.useCase}".locale is left as it is until untranslated is 0`,
    );
  }
  // A mistyped location would otherwise only show up as an untranslated text elsewhere.
  const unmatched = Object.keys(table).filter((l) => !used.has(l));
  if (unmatched.length > 0) {
    console.log(`\ntable entries that matched nothing: ${unmatched.length}`);
    unmatched.forEach((l) => console.log(`  ${l}`));
  }
  if (keptPlain.length > 0) {
    console.log(`\nplain strings left as they are: ${keptPlain.length}`);
    keptPlain.forEach((p) => console.log(`  ${p}`));
  }
  suspicious.push(...sameLabelWarnings(fieldLabels));
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

/**
 * Two fields of one entity with different English labels but the same translation look
 * alike in the form, e.g. "Departure" and "Check-out" both as "Salida".
 */
function sameLabelWarnings(fieldLabels) {
  const groups = new Map();
  for (const { file, segments, source, translation } of fieldLabels) {
    const n = segments.length;
    if (segments[n - 1] !== "label" || segments[n - 3] !== "attributes")
      continue;
    const entity = `${displayPath(file)}:${pathOf(segments.slice(0, n - 3))}`;
    const key = `${entity}\n${translation.toLowerCase()}`;
    if (!groups.has(key))
      groups.set(key, { entity, translation, fields: new Map() });
    groups.get(key).fields.set(source.toLowerCase(), segments[n - 2]);
  }
  return [...groups.values()]
    .filter(({ fields }) => fields.size > 1)
    .map(
      ({ entity, translation, fields }) =>
        `${entity} - fields ${[...fields.values()].join(", ")} all translate to "${translation}"`,
    );
}

/**
 * Adds the new locale to the `locale` list of the use case in available-configs.json.
 * A use case without `locale` is offered in every language and stays that way:
 * a list would restrict it to the languages in it.
 */
function registerLocale(configs, options) {
  const index = configs.findIndex((c) => c.id === options.useCase);
  if (index < 0) return [];
  const before = configs[index].locale;
  if (before === undefined) {
    console.log(
      `  note: "${options.useCase}" has no locale, so it is offered in every language already`,
    );
    return [];
  }
  if (typeof before === "string") {
    console.log(
      `  note: "${options.useCase}".locale was ${JSON.stringify(before)} - ` +
        `turning it into a list. Review that part of the diff by hand.`,
    );
    return [{ segments: [index, "locale"], value: [before, options.target] }];
  }
  if (before.includes(options.target)) return [];
  return [
    {
      segments: [index, "locale", beforeLast(before.length)],
      value: options.target,
      isArrayInsertion: true,
    },
  ];
}

function check(options) {
  let withSource = 0;
  let withTarget = 0;
  const missing = [];
  const plain = [];

  for (const file of resolveFiles(options)) {
    const { data } = readJson(file);
    const { part } = translatablePart(file, data, options);
    walk(part, options.source, (map, segments) => {
      withSource++;
      if (map[options.target] !== undefined) withTarget++;
      else
        missing.push(`${locationOf(file, segments)} - ${map[options.source]}`);
    });
    walkPlainTexts(part, textPropertiesOf(file), (parent, key, segments) =>
      plain.push(
        `${locationOf(file, segments)} - ${JSON.stringify(parent[key])}`,
      ),
    );
  }

  const list = (lines) => {
    lines.slice(0, 20).forEach((m) => console.log(`  ${m}`));
    if (lines.length > 20) console.log(`  ... and ${lines.length - 20} more`);
  };
  console.log(`maps with ${options.source}: ${withSource}`);
  console.log(`maps with ${options.target}: ${withTarget}`);
  console.log(`missing ${options.target}: ${missing.length}`);
  list(missing);
  // Not an error: a text property can still hold an identifier, see walkPlainTexts.
  console.log(`plain strings: ${plain.length}`);
  list(plain);

  if (options.useCase) {
    const configs = JSON.parse(readFileSync(AVAILABLE_CONFIGS, "utf8"));
    const locale = configs.find((c) => c.id === options.useCase)?.locale;
    const listed =
      locale === undefined ||
      (Array.isArray(locale) && locale.includes(options.target));
    console.log(
      `\n"${options.useCase}".locale: ${JSON.stringify(locale)}` +
        (locale === undefined ? "  (offered in every language)" : "") +
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
  --out-dir <dir>      extract: where to write the batch files (labels-01.json, prose-01.json, ...)
  --table <path>       apply: a {location: translation} table, or a directory whose
                       *.table.json files are read together
  --out <file>         apply: write to this file instead of in place (single input)
  --dry-run            apply: report what would change, write nothing
  --verbose            apply: print every map that was changed

examples:
  node translate-config.js extract --target es --use-case education --out-dir "\${TMPDIR:-/tmp}/translate-es"
  node translate-config.js apply --target es --use-case education --table "\${TMPDIR:-/tmp}/translate-es"
  node translate-config.js check --target es --use-case education
`;

function parseArgs(argv) {
  const options = { source: "en-US", paths: [] };
  const flags = {
    "--target": "target",
    "--source": "source",
    "--use-case": "useCase",
    "--out-dir": "outDir",
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
