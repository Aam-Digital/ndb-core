# Internationalization (i18n)

The application supports multiple languages. Translatable text is marked in the code,
extracted automatically, translated in an external tool and loaded into the app at runtime.

This document covers the full picture:

1. [How translations work](#how-translations-work) — the pipeline from source string to translated app.
2. [Multi-lingual configuration](#multi-lingual-configuration) — texts admins configure, stored per language.
3. [Marking text for translation](#marking-text-for-translation) — how to write localizable components (developer guide).
4. [Formatting dates, numbers and other data](#formatting-dates-numbers-and-other-data).
5. [Pluralization and selection (ICU)](#pluralization-and-selection-icu).
6. [Do's and don'ts](#dos-and-donts).
7. [Right-to-left (RTL) languages](#right-to-left-rtl-languages).
8. [Adding a new language](#adding-a-new-language).

---

## How translations work

Translations are managed through [POEditor](https://poeditor.com/join/project/CGn4IA7Ilz).
Developers only mark strings as translatable in the code (see below).
The CI tools are automatically publishing these texts for translation then.

### Workflow

1. **Source strings extraction**: On every push to `master`, a GitHub Action runs `ng extract-i18n`
   to extract translatable strings and uploads them to POEditor.
2. **Translation**: Translators work in POEditor's web UI.
3. **Publication**: When a release is published, a GitHub Action exports translations from POEditor
   as JSON and publishes them to GitHub Pages at `locale/{version}/messages.{lang}.json`.
4. **Runtime loading**: The app fetches translations from the GitHub Pages CDN at startup using
   the app version and selected locale (see `src/bootstrap-i18n.ts`) and applies them via
   `@angular/localize`'s `loadTranslations()`. The Angular service worker caches the files for
   offline use. There is no separate per-locale build — a single build serves all languages and
   loads the translations dynamically.

### Bootstrap order: don't localize before translations are loaded

Because translations are loaded at runtime, **anything evaluated before `initLanguage()` resolves
can only ever be English**. `$localize` does not fail in that case, it just returns the source
text — no error, no failing test, nothing visible in review.

`main.ts` loads the application itself with `await import("./app/app.module")` _after_
`initLanguage()`, so regular app code is safe. Only the small graph of modules statically imported
by `main.ts` runs earlier. Keep that graph minimal: bootstrap logic belongs in dependency-free
modules next to `main.ts` (`bootstrap-i18n.ts`, `bootstrap-environment.ts`, `bootstrap-reset.ts`,
`bootstrap-pwa-install.ts`), which must not import from `src/app/`. Importing a `@Injectable`
service into `main.ts` — even just for one `static` helper — drags that service's whole dependency
graph into the pre-i18n phase.

Within those modules, never evaluate `$localize` at module scope or in a `static` class member.
See the do's and don'ts below for how to write it instead.

### Manual re-export

If translations are updated in POEditor after a release, you can manually trigger the
"i18n - Publish translations to GitHub Pages CDN" workflow to update the translations for a
specific version. Verify that the source terms in POEditor still match the release version
before triggering (terms may have changed on `master` since the release).

---

## Multi-lingual configuration

Everything above is about text in the _source code_. Text that admins configure —
field labels, menu items, tab titles, report titles — lives in the config document
and in internal entities, so it never passes through POEditor. Those texts can be
stored in several languages instead.

### Enabling it for a system

Most systems are run in a single language, so this is off unless
`multiLingualConfigEnabled` is set for the deployment (in `environment.ts`, or per
system through `config.json`). It is on in dev builds.

The flag also decides whether users can switch the app's language at all (see
[Which language a user sees](#which-language-a-user-sees)).

For configured texts it only hides the editing UI — the buttons that open the translations dialog.
The buttons are also hidden while only one language is enabled (the default language, see
`SiteSettingsService.enabledLocales`), because there is nothing to translate into. Both
conditions are combined in `SiteSettingsService.translationsEnabled`.
Resolving is always on, so a system that has the flag turned off still displays texts
that are already stored per language, and turning it off cannot strand data.

Components that render their own translations button (rather than letting
`TranslatableTextInputComponent` draw it) read `translationsEnabled` off that
component, so the condition is looked up in one place.

### The stored format

A configurable text is either a plain string or a per-language map keyed by locale id:

```json
{ "label": "First name" }
```

```json
{ "label": { "en-US": "First name", "de": "Vorname" } }
```

Both are valid anywhere a text is configured, so single-language configs keep
working untouched. The type is `TranslatableText` in
[`multi-lingual-config.ts`](../config/multi-lingual-config.ts).

A value only counts as a translation map if **every** key is a known locale id
(or the base language of one, e.g. `en` for `en-US`) **and** every value is a
string. That deliberately conservative check keeps ordinary config objects from
being mistaken for translations.

Resolution falls back in this order: the active locale → its base language → the
default language (`en-US`) → the default's base language → the first non-empty
entry. A missing translation therefore shows _some_ text rather than nothing.

> **Register a new locale before any config ships text in it.** Until a locale id
> is listed in `AVAILABLE_LOCALES` ([`available-locales.ts`](./available-locales.ts)),
> a map containing that key is not recognised as a translation map and renders as
> `[object Object]`.

### Reading config: resolved vs raw

`ConfigService` exposes two views of the same document:

| Use                                 | Method                                  | Returns                                   |
| ----------------------------------- | --------------------------------------- | ----------------------------------------- |
| Displaying something                | `getConfig()` / `getAllConfigs()`       | texts resolved to the active language     |
| Reading it in order to save it back | `getRawConfig()` / `getAllRawConfigs()` | the stored value, translation maps intact |

**Every read-modify-save flow must use the raw accessors.** Saving a resolved
value would replace the map with the single language the editing admin happens to
be using, silently dropping every other translation.

The raw accessors return `RawConfig<T>`, which widens the known display properties
(`label`, `labelShort`, `labelPlural`, `description`, `title`, `header`) to
`TranslatableText`. Code that treats such a text as a plain `string` then fails to
compile — that is the point of the type.

When saving, merge the edited object back onto the raw one with
`mergeLocaleTranslations()`. It keeps the other languages and only overwrites the
active language's entry, and only where the text actually changed.

### Resolving a text in code

These all come from [`active-locale.ts`](./active-locale.ts) and use the active
locale, so no component needs to inject `LOCALE_ID` or know the list of locales:

| Helper                                 | Use                                                         |
| -------------------------------------- | ----------------------------------------------------------- |
| `resolveLocaleText(value)`             | one text; anything that is not a map is returned unchanged  |
| `resolveLocaleConfig(value)`           | a whole config tree, deep-resolved into a new object        |
| `mergeLocaleTranslations(raw, edited)` | merge an edited object back onto its raw counterpart        |
| `isLocaleTranslationMap(value)`        | whether a value is a per-language map                       |
| `getActiveLocale()`                    | the active locale id, e.g. to store a text edited in the UI |

In templates use the `localeText` pipe instead:

```html
{{ report.title | localeText }}
```

`Entity.toString()` already resolves `toStringAttributes`, so an entity whose
title is a map prints correctly with no extra work.

> `active-locale.ts` intentionally has no `@angular/*` imports and reads the locale
> from module state rather than DI, because `Entity` itself needs it and DI would
> create a circular import.

### Multi-lingual fields on an entity

An internal entity's own texts (e.g. `ReportConfig.title`,
`PublicFormConfig.description`) use the `translatable-text` datatype:

```ts
@DatabaseField({
  label: $localize`:ReportConfig:Title`,
  dataType: TranslatableTextDatatype.dataType,
})
title: TranslatableText;
```

That one line gives the field a translations editor, sorting by the displayed
text, a text filter matching the text in any language, and resolved CSV
exports. The datatype's transforms are the identity on purpose: the entity
holds the raw value, because resolving on save would drop the other languages.

Admins edit these through `TranslatableTextInputComponent`, which shows the active
language inline and opens `ConfigureTranslationsPopupComponent` for the full
per-language list.

### Which language a user sees

The active locale is stored in `localStorage` and read at bootstrap.

**Without `multiLingualConfigEnabled`** nobody can switch: everyone uses the _system
language_ (`SiteSettings.defaultLanguage`). A user's own language
and a language picked on the device earlier are ignored (the saved `UserSettings`
stay untouched, the locale stored on the device is overwritten with the system
language). The default language is only enforced when one is actually set: on a fresh
system, or while the site settings have not arrived (waiting up to
`LanguageService.SITE_DEFAULT_WAIT_MS`), the current locale is left as it is instead
of falling back to `en-US`. The language picked in the setup assistant is saved as
the default language (`SiteSettingsService.setDefaultLanguage()`), with or without the flag. The profile shows the language selector disabled with an explanation,
and public forms hide it. The "Enabled languages" site setting shows that the
feature is disabled (`EditAvailableLocalesComponent`).

**With the flag** users can switch among `SiteSettingsService.enabledLocales`: the
default language plus the "Enabled languages" (`availableLocales`); the stored
selection comes first, the default language is appended if missing, so an empty
selection enables only the default language. Only a system without any system
language and selection (not set up yet, or settings not loaded) has all languages
enabled. What puts the locale into `localStorage`:

- **At startup** — whatever the language switcher last stored. If nothing is
  stored, `SiteSettings.defaultLanguage` (the system-wide default) is applied.
- **On every login** — the user's own `UserSettings.defaultLanguage`. If they have
  none, the language already picked on this device is kept. Only a locale that was
  applied from _another_ account's settings is reset to the site default (or to
  `en-US` if the site has none), so a shared browser does not pass one user's
  choice on to the next. For this, the id of that account is stored next to the
  locale (`localeOwner`).
- **When the user's settings change in the database** — e.g. when they arrive with
  the first sync on a new device, or were changed on another device.

`UserSettings` is a separate entity type from `SiteSettings` on purpose: permissions
are granted per entity type, so sharing one type would mean granting every user
write access to the site branding.

Users can only pick their own language where `Config:Permissions` grants them their
own document, e.g. in `_default`:
`{ "subject": "UserSettings", "action": "manage", "conditions": { "userId": "${user.id}" } }`.
`UserSettings.userId` is persisted for this purpose, because rule variables cannot be
matched against a part of the `_id`. Without such a rule the profile shows the
selector disabled with an explanation, and a rejected save is not reported to Sentry.

Switching the language reloads the page, because the `$localize` translations and
the active locale are both fixed at bootstrap.

## Marking text for translation

To make a component's text translatable, mark it in the code so `extract-i18n` can pick it up.

### Short answer

1. In your HTML templates, mark any text that should be translated using the `i18n` directive:

   ```html
   <button i18n-title="<meaning>|<description>" title="I am a button" i18n="<meaning>|<description>">Click me!</button>
   ```

2. In TypeScript, mark strings that may be translated using the `$localize` function:

   ```typescript
   const notification = $localize`I have eaten all ${number} Muffins`;
   ```

### The i18n directive

The `i18n` directive allows up to three optional arguments. The first two —
meaning and description — are used to aid translators while analyzing the
texts. The third one is an optional ID. This ID is generated by Angular and
does not have to be provided.

If different components have the same content and the same meaning, they will
be merged automatically, it is therefore not required (and will, in fact,
generate a warning) to assign a custom id to components that should be
translated in the same way. To enable this behavior, the same content and
meaning should be provided.

The meaning of a text message is important so that translators can understand
what the text should represent, even without having to see the actual website.
Take this example:

```html
<span i18n>Address of {{user}}: {{user.address}}</span>
```

Without further knowledge, what does address refer to? The physical address
of the user, or his internet-address?
It is therefore always good practice including a meaning and further description
like so:

```html
<span i18n="Address field|The address that a user lives at"> Address of {{user}} </span>
```

The `i18n` directive can also be used to translate tooltips, titles and other
attributes of the element. This is done by writing `i18n-title`,
`i18n-matTooltip`, e.t.c. The rules are the same as for the regular directive.

### The $localize function

While HTML elements can be marked for translation using the `i18n` directive,
the same is not true for strings in non-HTML components. To enable localization
here, the function `$localize()` is used. It is comparable to the directive,
however some small changes have to be taken into account:

1. Meaning and description of the string to translate are in front of the actual
   string and are marked using two colons (`:`).
2. The translate-function is special in that it conceptually does not have
   parameters. Instead, the string is directly written after the identifier

Example:

```typescript
alertService.warn($localize`:Illegal input warning:Please provide the correct input for ${field}`);
```

Variables inside the string can be of arbitrary complexity and are escaped using the
`${}` syntax.

---

## Formatting dates, numbers and other data

Texts are not the only thing characterizing an international app. Other data
has a different expression in different cultures. To enable this, several pipes
can be used to transform that data automatically. For example:

```angular2html
<span>It's a nice day {{today | date}}</span>
```

Will transform the date to different locales.
Pre-built pipes are

- `DatePipe`: Formats a date
- `CurrencyPipe`: Transforms a number to a currency string
- `DecimalPipe`: Transforms a number into a decimal string with given accuracy
- `PercentPipe`: Transforms a number to a percent-string

---

## Pluralization and selection (ICU)

ICU is another standard that Angular uses to localize strings. There
are two ICU-standards of interest: Pluralization and Selection

### Pluralization

Some phrases contain plurals, such as

```angular2html
<span>The game starts in {{minutesTillStart}} minutes</span>
```

This can produce the incorrect result of "The game starts in 1 minutes". To
improve this, one should use plural forms. These have the following syntax:

```angular2html
{ amount, plural, =0 {none} =1 {one} other {other cases} }
```

**amount** is the selector — how much actually exists. Following this,
the **plural** selector follows, indicating that this is a pluralized form.
Finally, the different values that one can pluralize are described. Legal
values are

- `=x` matches, when the amount is exactly that value
- `one`
- `two`
- `few`
- `many`
- `others`

`others` matches all amounts that cannot be matched by anything else. So the
text above could be pluralized like this:

```angular2html
<span>The game starts { minutesTillStart, plural,
  =0 {right now}
  one {in one minute}
  others {in {{minutesTillStart}} minutes} }
</span>
```

### Selection

Selection selects one option of a set of selections. A suitable example
for this is the gender of a person:

```html
This is {{person}}. {gender, select, male {He} female {She}} is a nice person.
```

Can be translated to the variants "This is Tom. He is a nice person" as well as
"This is Nancy. She is a nice person". The syntax is:

```html
{variable, select optionA {value_optionA} optionB {value_optionB} ...}
```

The variable's type is arbitrary, however the options have to make sense.
Types that are known to work well are the standard types of strings, numbers
and booleans.

### Do's and don'ts

- Try to keep your translatable texts as simple as possible concerning the
  amount of string-interpolation or computation inside the `{{}}`-Blocks. This
  makes it easier for translators
- It may be tempting sometimes to do a 'string-in string' interpolation like so:

  ```angular2html
  <div>
  My cat likes milk {{catLikesCheese ? "and cheese" : ""}}
  </div>
  ```

  This **must** not be done. It is hard for translators to understand what's
  going on inside the interpolation, and the translated text might not
  be accepted by Angular's localize-package. Instead, you could use a
  custom getter:

  ```typescript
  get catYumYum(): string {
    return $localize`My cat likes milk${andMore}`;
  }
  get andMore(): string {
    return catLikesCheese ? " " + $localize`and cheese` : "";
  }
  ```

  ```angular2html
  <div>{{catYumYum}}</div>
  ```

  where both parts can be localized individually. It is important
  to provide a good description here.

  Another possibility is to use the ICU selection syntax:

  ```angular2html
  <div>
  My cat likes milk { catLikesCheese, select, true {And Cheese} false {} }
  </div>
  ```

- Using the `$localize` function, the placeholders can accept id's that
  might simplify the translation process:

  ```typescript
  $localize`Hello, ${v123}:HELLO_VAR:`;
  ```

  In this example, `HELLO_VAR` is the id for the variable-substitution
  `v123`. A descriptive id might aid in the translation process.

  This is not possible using the `i18n` tag. In this case, the id
  will implicitly be `INTERPOLATION` and cannot be changed

---

## Right-to-left (RTL) languages

Arabic, Hebrew, Urdu and others are read right to left. Translating the strings is not enough: the layout has
to mirror as well.

The direction is applied once during the i18n bootstrap, from the locale itself, before Angular starts:

```typescript
document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr";
```

It has to happen that early because Angular Material reads the direction when the CDK's `Directionality` is first constructed, and never looks again. Nothing switches direction at runtime - changing the language reloads the page.

Everything below is about writing components that follow that direction.

### Use logical CSS properties

Write `inline-start` / `inline-end` instead of `left` / `right`, and the browser mirrors them for you:

```scss
margin-inline-start: 8px; // not margin-left
padding-inline-end: 8px; // not padding-right
inset-inline-start: 0; // not left: 0
text-align: start; // not text-align: left
border-start-end-radius: 4px; // not border-top-right-radius
```

Block directions (`top`, `bottom`) stay physical - only the inline axis flips. `left` / `right` are still correct for anything that is genuinely geometric, such as centring with `left: 50%` and a transform.

### Scoping styles to RTL inside a component

A plain `[dir="rtl"]` selector in a component stylesheet **silently does nothing**. View encapsulation rewrites it to `[dir="rtl"][_ngcontent-xyz]`, which can never match `<html dir="rtl">`. Use `:host-context()`:

```scss
.panel {
  clip-path: polygon(0 0, 100% 0, 100% 100%);

  :host-context([dir="rtl"]) & {
    clip-path: polygon(0 0, 100% 0, 0 100%);
  }
}
```

CSS custom properties are unaffected, because they inherit through the DOM - which is why the shared values below are defined as variables rather than as rules.

### Mirroring icons

Add `.mirror-in-rtl` to icons whose meaning depends on reading direction - arrows, chevrons, tree twisties:

```angular2html
<fa-icon icon="chevron-right" class="mirror-in-rtl"></fa-icon>
```

Never apply it broadly. A blanket flip also mirrors the search magnifier, the logo and every other icon that means the same thing in both directions.

### Typography

Arabic letters join to one another, so some ordinary CSS actively damages them. Two variables are set per direction in `ui.component.global-styles.scss`:

- `--letter-spacing-wide` is `0` in RTL. Tracking pulls joined letters apart.
- `--line-height-scale` is `1.3` in RTL. Tight line boxes clip the diacritics.

```scss
letter-spacing: var(--letter-spacing-wide);
line-height: calc(1.2 * var(--line-height-scale));
```

### Isolating content from the surrounding direction

The UI follows the document direction, but _content_ should resolve its own. Three tools, by what the value is:

- `dir="auto"` for free text a user wrote, which may be in any language
- `dir="ltr"` for values that are always left-to-right regardless of the UI
  language - phone numbers, emails, URLs, IDs
- `<bdi>` around a value embedded in a sentence, so it cannot reorder the text
  around it

```angular2html
<textarea dir="auto"></textarea>
<input type="email" dir="ltr" />
<bdi>{{ value | customDate }}</bdi>
```

Watch for number pairs with spaces, like `{{ a }} / {{ b }}`. The spaced slash is a neutral character, so under RTL the two numbers swap and `1 / 3` renders as `3 / 1`. Wrap them in `<bdi dir="ltr">`.

### Reading the direction from TypeScript

Where a value cannot be expressed in CSS, inject the CDK's `Directionality`:

```typescript
private readonly directionality = inject(Directionality);

position:
  this.directionality.value === "rtl" ? { left: "0px" } : { right: "0px" };
```

In a stylesheet, the `--text-x-direction` variable (`1` in LTR, `-1` in RTL) does the same job for transforms and angles, which have no logical equivalent:

```scss
transform: scaleX(var(--text-x-direction, 1));
```

---

## Adding a new language

This section depicts the workflow one needs to go through to add another language
(such as _hindi_, _bengali_, _french_ etc.) to the project.

### 1) Find the correct language code

You first need the correct ISO-639-1 Language-Code.
To find this code for a given language, go to their [website](https://www.loc.gov/standards/iso639-2/php/code_list.php)
and find the code that corresponds to your language (look in the `ISO 639-1 Code` column).
For example, for _french_, this would be `fr`, for _hindi_, this would be `hi`

In addition to a language code, you might consider specifying a country if the spoken language can
differ based on where the app should be shipped to. For example, English is spoken differently
in the US (`en-US`), Great-Britain (`en-GB`) or Australia (`en-AU`).
A list of available country codes can be found in the [ISO country code list](https://www.iso.org/obp/ui/#search/code/).
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

Add the language to `AVAILABLE_LOCALES` in `src/app/core/language/available-locales.ts`.
This allows the app to show the language in the language select component.

A right-to-left language needs nothing beyond this: `isRtlLocale` already knows them
(see `language-statics.ts`), so the document direction and the RTL styles follow.

### 5) Register Angular locale data

In `src/bootstrap-i18n.ts`, add an `else if` branch for the new locale to import the
Angular locale data (this is what makes locale-aware pipes such as `DatePipe` work):

```typescript
} else if (locale == "hi") {
  localeModule = await import("@angular/common/locales/hi");
}
```

### 6) Test your build

Run the app. You can change the language in the top right corner.
If translations have not yet been added in POEditor, the app will show English fallback text.
