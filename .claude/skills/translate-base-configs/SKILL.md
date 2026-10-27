---
name: translate-base-configs
description: Translate the base configs of a use case into an additional language, so a new system can be set up in that language. Use when someone says "translate the base configs to Spanish", "add Arabic to the education use case", "we need the setup wizard in Portuguese", "translate this config export", or wants a new language in src/assets/base-configs. Works on the base configs in the repository and on a config downloaded through "AI assisted config" in the admin area.
argument-hint: <use-case-id> <target-locale>, e.g. "education es" (optional)
---

# Translate base configs into another language

Base configs are JSON documents in which a user-visible text is either a map of locale
code to text, e.g. `{"en-US": "Male", "de": "männlich", "ar": "ذكر"}`, or a plain string
in a config that was never translated, e.g. `"label": "First Name"`. Adding a language
means adding one key to every map and turning every plain text into a map - a few hundred
per use case - without touching anything else in the file.

[translate-config.js](translate-config.js) does the mechanical parts, so the translation
is the only thing left to think about: it collects the strings, writes the translations
back, and counts. **The counting is the point.** Without it strings get skipped silently
and nobody notices until a user sees English text in a Spanish system.

**Not in scope:** making the language available in the app itself (`available-locales.ts`,
`bootstrap-i18n.ts`, `i18n-publish-translations.yml`, RTL styles and
`site-settings.service.ts` for right-to-left languages). That is a separate job, usually
done in the same PR. This skill only fills the base config files.

## Steps

1. **Settle the input and the target.** Two cases:
   - A use case in the repository, e.g. `education` and `es`. The script resolves which
     files belong to it through `entitiesToImport` in `available-configs.json`. Run every
     command from the repository root.
   - A config downloaded through **AI assisted config** in the admin area: one JSON file
     holding an array of config documents from a live instance. Pass its path instead of
     `--use-case`, and write the result to a new file with `--out` (step 4), so the
     export stays as it is: it is the way back if the upload goes wrong.

   Ask for the use case or the locale if either is missing. Use the locale code as the app
   writes it (`es`, `fr`, `ar`, `pt-BR`), matching `available-locales.ts`.

2. **Extract what is missing** into a new, empty directory:

   ```
   node .claude/skills/translate-base-configs/translate-config.js extract --target es --use-case education --out-dir "${TMPDIR:-/tmp}/translate-es"
   ```

   This writes batch files - `labels-01.json`, `labels-02.json`, … for short texts and
   `prose-01.json`, … for texts over 80 characters - each small enough to read and
   translate in one go, and prints how many texts went into which file. Each entry is
   one occurrence of a text: its `location` (file and path), the English `source`, the
   translations that already exist in other languages (`existing`) and the names of what
   it sits in (`context`: the document id, the entity label, the panel title, …).
   - Entries with `"plain": true` are plain strings in a text property (`label`,
     `labelShort`, `labelPlural`, `description`, `title`, `header`, and `name` of the use
     case entry). In a config that was never translated, every text is one of these.
     `toBlockDetailsAttributes` and `fieldMapping` are skipped: their `title` names a
     field, and turning it into a map breaks the config.
   - Identical English texts are not merged, because they can need different
     translations. They are sorted next to each other and always end up in the same
     batch.

3. **Translate, one batch at a time.** Read the whole batch, then write its table next to
   it: `labels-01.json` gets `labels-01.table.json`, a flat `{"<location>": "Spanish"}`
   JSON object with one entry for every entry in the batch. Copy each `location` exactly.
   - Use the existing `de`/`fr` values next to each string to stay consistent with the
     terminology the app already uses.
   - Give the same English text the same translation everywhere - a field label and the
     column header for that field must match - unless the location shows a different
     meaning. Existing translations that differ between occurrences (e.g. "Participants"
     as "Teilnehmer:innen" in one place and "Teilnehmer" in another) are the strongest
     hint; decide per occurrence and mention it in the report. Terms chosen in an
     earlier batch stay the same in the later ones.
   - Give two fields of the same entity two different words, even where the natural
     translation is the same: "Departure" and "Check-out" on one booking cannot both be
     "Salida".
   - Work through the `labels` and `prose` batches separately. Prose is config text that
     users read as a page - the setup wizard steps, help pages, email templates - and it
     needs the care that a one-word label does not.
   - Keep everything that is not language: markdown headings and list markers, `\n` line
     structure, link targets and URLs, placeholders like `{{name}}`, and product names
     such as "Aam Digital". Translate the link text, never the link target.
   - Translate what the English means, not its mistakes: "Italian" in a list of countries
     is Italy, a plural label that reads "Event" gets the plural. Note every such problem,
     and leftovers like "TEST COPY …", for the report, so the English can be fixed too.
   - Leave a plain entry out only if it is an identifier rather than a text. Apart from
     the skipped objects above that is rare; check the `location` when unsure.

4. **Apply the tables.** Pass the directory and every `*.table.json` in it is read:

   ```
   node .claude/skills/translate-base-configs/translate-config.js apply --target es --use-case education --table "${TMPDIR:-/tmp}/translate-es"
   ```

   The script edits the text of each file in place (with `jsonc-parser`), so an indented
   file keeps its indentation and line endings and nothing changes but the added
   translations. The new key goes in as the **second to last** one in each map, so the
   line before it is not touched and the diff is pure insertions. Keep it that way: `ar`
   stays last.

   There are two exceptions, both shown as changed lines. A map that held only `en-US`
   gets the key appended, so the English line gains a comma. A plain string from the
   table becomes `{"en-US": …, "es": …}`, so its line is replaced. Both come up in a use
   case that is translated for the first time, e.g. `event-management`.

   **`untranslated` has to be 0.** Anything above 0 is printed with its location and
   text - add it to a table and run again. A non-zero count is never "close enough": that
   is exactly how a string gets skipped. Until it is 0, the new code is not added to the
   `locale` list of the use case.
   - `table entries that matched nothing` lists locations that are not in the configs,
     usually a mistyped one; fix it.
   - `plain strings left as they are: N` lists every plain string that was not in a
     table. Each one has to be an identifier, not a text; add the texts and re-run.
   - `check by hand: N` lists translations whose line count or markdown markers differ
     from the English - usually prose that lost its structure - and fields of one entity
     whose different English labels got the same translation. Open each one, fix the
     table, re-run.

   For a downloaded config add `--out <new-file.json>`.

5. **Verify.**

   ```
   node .claude/skills/translate-base-configs/translate-config.js check --target es --use-case education
   ```

   `missing es: 0` is the assertion, and the `locale` list of the use case has to contain
   the new code (a use case without `locale` is offered in every language and is left
   that way). The command exits non-zero while either is open, so re-run it after every
   fix. It finds maps by their English key, so a map with a translation but no `en-US` is
   a broken config it cannot see at all. `plain strings` does not fail the command,
   because identifiers stay plain: go through the list and make sure no text is left in it.

   - **Use case:** then `git diff --stat -- src/assets`: insertions only, apart from the
     lines described in step 4. Any other changed line means something reformatted a
     file - find out what before going on. (On Windows these files are checked out with
     CRLF and `prettier --check` fails on them untouched. Do not "fix" that with
     `prettier --write`; it rewrites every line of every file.)
   - **Downloaded config:** run `check` on the `--out` file; there is no `locale` list.
     Leave the upload to the user: in the admin area, under **Technical Administration**,
     **Upload Application Configuration (JSON)**. The upload overwrites every document in
     the file, so changes made on the instance since the export are lost. Upload soon
     after the export, or export again and re-run if someone edited the config meanwhile.

6. **Report** the use case or file, the locale, how many maps and strings,
   `untranslated: 0`, how many plain strings were converted and which were kept as
   identifiers, the problems found in the English (step 3), and the files that changed.
   - For a use case, say explicitly that shared files under `basic/` are part of the diff
     when the use case imports them - translating `education` also touches
     `basic/ConfigurableEnum_genders.json` and others, which surprises reviewers who
     expect changes under `education/` only.
   - For a downloaded config, say that the export and the result hold production config:
     they must not be committed, and both can be deleted once the upload worked.

## Before you finish

- `untranslated: 0` from `apply` and `missing <locale>: 0` from `check`, both from a real
  run, not from memory.
- Every plain string still listed by `check` is an identifier, not a text.
- For a use case: `git diff --stat` shows insertions, and the only changed lines are
  English ones that gained a comma or plain strings that became maps (step 4). The use
  case entry in `available-configs.json` has the new code in `locale` (unless it has no
  `locale` at all), and its `name` and `description` are translated too.
- Prose was read in full once more in the target language: headings, links and line
  breaks intact.
- Nothing was committed and nothing was uploaded. The user decides both.
