# How to add another language to the project

## Abstract

This guide depicts the workflow one needs to go through to add another language
(such as _hindi_, _bengali_, _french_ e.t.c.) to the project.

Translations are managed through [POEditor](https://poeditor.com/join/project/CGn4IA7Ilz)
and published automatically to a GitHub Pages CDN at release time.

### 1) Find the correct language code

You first need the correct ISO-639-2 Language-Code. To find this code for a given
language, go to their [website](https://www.loc.gov/standards/iso639-2/php/code_list.php)
and find the code that corresponds to your language (look in the `ISO 639-1 Code` column).
For example, for _french_, this would be `fr`, for _hindi_, this would be `hi`

In addition to a language code, you might consider specifying a country if the spoken language can
differ based on where the app should be shipped to. For example, English is spoken differently
in the US (`en-US`), Great-Britain (`en-GB`) or Australia (`en-AU`).
A list of available country codes can be found [here](https://www.iso.org/obp/ui/#search/code/).
Once you have the language and country code, the resulting code is _language code_-_country code_.

### 2) Add the language to POEditor

Add the new language in the [POEditor project](https://poeditor.com/join/project/CGn4IA7Ilz).
This makes the language available for translators.

### 3) Update the publish workflow

In `.github/workflows/i18n-publish-translations.yml`, add the language code to the `LANGUAGES`
environment variable so that the export workflow includes the new language:

```yaml
env:
  LANGUAGES: "fr de hi"
```

### 4) Add language to the UI

Add the language to the `availableLocales` list in `src/app/core/language/languages.ts`.
This allows the app to show the language in the language select component.

### 5) Register Angular locale data

In `src/bootstrap-i18n.ts`, add an `else if` branch for the new locale to import the
Angular locale data:

```typescript
} else if (locale == "hi") {
  localeModule = await import("@angular/common/locales/hi");
}
```

### 6) Test your build

Run the app. You can change the language in the top right corner.
If translations have not yet been added in POEditor, the app will show English fallback text.

### Conclusion

You have now successfully added a new language. Translators can work in POEditor,
and translations will be automatically exported and published with each release.
