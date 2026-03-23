# How translations work

## Translation Management

Translations are managed through [POEditor](https://poeditor.com/join/project/CGn4IA7Ilz).

### Workflow

1. **Source strings extraction**: On every push to `master`, a GitHub Action runs `ng extract-i18n`
   to extract translatable strings and uploads them to POEditor.
2. **Translation**: Translators work in POEditor's web UI.
3. **Publication**: When a release is published, a GitHub Action exports translations from POEditor
   as JSON and publishes them to GitHub Pages at `locale/{version}/messages.{lang}.json`.
4. **Runtime loading**: The app fetches translations from the GitHub Pages CDN at startup using
   the app version and selected locale. The Angular service worker caches the files for offline use.

### Manual re-export

If translations are updated in POEditor after a release, you can manually trigger the
"i18n - Publish translations to GitHub Pages CDN" workflow to update the translations for a
specific version. Verify that the source terms in POEditor still match the release version
before triggering (terms may have changed on `master` since the release).

### Adding a new language

See the [Add another Language](add-another-language.md) guide.
