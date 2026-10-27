---
name: translate-base-configs
description: Translate the base configs of a use case into an additional language, so a new system can be set up in that language. Use when someone says "translate the base configs to Spanish", "add Arabic to the education use case", "we need the setup wizard in Portuguese", "translate this config export", or wants a new language in src/assets/base-configs. Works on the base configs in the repository and on a config downloaded through "AI assisted config" in the admin area.
argument-hint: <use-case-id> <target-locale>, e.g. "education es" (optional)
---

# Translate base configs into another language

Base configs are JSON documents in which every user-visible text is a map of locale code
to text, e.g. `{"en-US": "Male", "de": "männlich", "ar": "ذكر"}`. Adding a language means
adding one key to every one of those maps - a few hundred per use case - without touching
anything else in the file.

[translate-config.js](translate-config.js) does the mechanical parts, so the translation
is the only thing left to think about: it collects the strings, writes a table back, and
counts. **The counting is the point.** Without it strings get skipped silently and nobody
notices until a user sees English text in a Spanish system.

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
     `--use-case`, and always write the result elsewhere with `--out` (see step 4).

   Ask for the use case or the locale if either is missing. Use the locale code as the app
   writes it (`es`, `fr`, `ar`, `pt-BR`), matching `available-locales.ts`.

2. **Extract what is missing.**

   ```
   node .claude/skills/translate-base-configs/translate-config.js extract --target es --use-case education > strings.json
   ```

   The result lists every string that has no `es` yet, deduplicated, split into `labels`
   (short) and `prose` (over 80 characters), each with the translations that already exist
   in other languages and the exact paths where it occurs. Read the whole file before
   translating anything.

3. **Translate.** Produce a flat `{"English": "Spanish"}` JSON table covering every entry
   from `labels` and `prose`, and nothing else.
   - Use the existing `de`/`fr` values next to each string to stay consistent with the
     terminology the app already uses. A label that is a field name in one view and a
     column header in another must get the same word.
   - Work through `labels` and `prose` separately. Prose is config text that users read
     as a page - the setup wizard steps, help pages, email templates - and it needs the
     care that a one-word label does not.
   - Keep everything that is not language: markdown headings and list markers, `\n` line
     structure, link targets and URLs, placeholders like `{{name}}`, and product names
     such as "Aam Digital". Translate the link text, never the link target.
   - When one English string occurs in clearly different contexts (check `paths`), the
     table can only hold one translation for it. Say so instead of silently picking one.

4. **Apply the table.**

   ```
   node .claude/skills/translate-base-configs/translate-config.js apply --target es --use-case education --table table.json
   ```

   The new key goes in as the **second to last** one in each map, so the line before it is
   not touched and the diff is pure insertions. Keep it that way: `ar` stays last.

   **`untranslated` has to be 0.** Anything above 0 is printed with its text - add it to
   the table and run again. A non-zero count is never "close enough": that is exactly how
   a string gets skipped. `check by hand: N` lists translations whose line count or
   markdown markers differ from the English - usually prose that lost its structure. Open
   each one, fix the table, re-run.

   For a downloaded config add `--out <new-file.json>`; the script refuses to rewrite a
   file whose formatting it would change. That result goes back into the instance, it is
   not something to commit.

5. **Verify.**

   ```
   node .claude/skills/translate-base-configs/translate-config.js check --target es --use-case education
   ```

   `missing es: 0` is the assertion, and the `locale` list of the use case has to contain
   the new code. The command exits non-zero while either is open, so re-run it after every
   fix. It finds maps by their English key, so a map with a translation but no `en-US` is
   a broken config it cannot see at all.

   Then `git diff --stat -- src/assets`: insertions only. A single removed line means
   something reformatted a file - find out what before going on. (On Windows these files
   are checked out with CRLF and `prettier --check` fails on them untouched. Do not "fix"
   that with `prettier --write`; it rewrites every line of every file.)

6. **Report** the use case, the locale, how many maps and strings, `untranslated: 0`, and
   the files that changed. Say explicitly that shared files under `basic/` are part of the
   diff when the use case imports them - translating `education` also touches
   `basic/ConfigurableEnum_genders.json` and others, which surprises reviewers who expect
   changes under `education/` only.

## Before you finish

- `untranslated: 0` from `apply` and `missing <locale>: 0` from `check`, both from a real
  run, not from memory.
- `git diff --stat` shows insertions and no deletions.
- The use case entry in `available-configs.json` has the new code in `locale`, and its
  `name` and `description` are translated too.
- Prose was read in full once more in the target language: headings, links and line
  breaks intact.
- Nothing was committed. The user decides when to commit.
