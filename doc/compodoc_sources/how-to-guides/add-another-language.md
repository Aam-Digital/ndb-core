#How to add another language to the project

## Abstract
This guide depicts the workflow one needs to go through to add another language 
(such as _hindi_, _bengali_, _french_ e.t.c.) to the project

###1) Find the correct language code
You first need the correct ISO-639-2 Language-Code. To find this code for a given
language, go to their [website](https://www.loc.gov/standards/iso639-2/php/code_list.php)
and find the code that corresponds to your language (look in the `ISO 639-1 Code` column). 
For example, for _french_, this would be `fm`, for _hindi_, this would be `hi`

In addition to a language code, you might consider specifying a country if the spoken language can
differ based on where the app should be shipped to. For example, english is spoken differently
in the US (`en-US`), in Great-Britain (`en-GB`) or in Australia (`en-AU`).
A list of available country codes can be found [here](https://www.iso.org/obp/ui/#search/code/).
Once you have the language and country code, the resulting code is _language-code_-_country-code_.

###2) Add the language to the list of known languages
The file [angular.json](angular.json) contains all available languages. In this file, look for the
`i18n` section. Add the language code from the last step (possible including the region code) 
to the `locales` section. For example, if you wanted to translate into French, this is what the 
`i18n` section should look like:

```json
{
  ...
  "i18n": {
    "sourceLocale": "en-US",
    "locales": {
      // other locales
      "fr": "src/locale/messages.fr.xlf"
    }
  },
  ...
}
```
The path (`src/locale/messages.fr.xlf`) is a path to the translation file that you 
will create in the next step

###3) Let xliffmerge know about the new language
`xliffmerge` is a tool that helps in the translation process. Especially, it is needed to
update the language files while retaining old translations.

Go to [xliffmerge.json](xliffmerge.json) and add your language code to the `languages` section.
Again, for french, this could look like this:
```json
...
"languages": [
  // other languages
  "fr"
]
```

###4) Create a localization-file
In order to allow the actual translation process to take place, you need to create a 
standardized file that translaters can work with. The standard that we use is `xlf`, therefore
such a file is known as _xlf-file_

To generate a file, simply use the script `extract-i18n` located inside the [package.json](package.json)
file. This will automatically generate a file if none exists

###5) Update the nginx config for the dockerfile
We can build the Project using Docker. In order to build the app in every known locale
(at least for testing purposes) add the following lines to the nginx config inside the
server section (for example, for french):
```nginx configuration
location /fr/ {
    autoindex on;
    try_files $uri$args $uri$args/ /fr/index.html=404;
}
```

###6) Test your build
In production, all (or a subset) of available languages are build. However, when testing,
you can only use one language (to avoid too complex dev builds). You can set the language
that you would like your map to be inside the [angular.json](angular.json) file at the section
`projects/ndb-core/architect/build`. Find the option `localize` and replace the existing language
with the language that you just created. It should look like this:
```json
...
"polyfills": "src/polyfills.ts",
"localize": ["fr"],
...
```
Run the app. If you have not added translations, the app will be in english. 
Try to translate some units. 

In order to do this, go to the
newly created `src/locale/messages.<locale>.xlf` file. Inside this file, you will find a lot of
"trans-units". These mark single texts that you can translate. Translate one or more
of these units by replacing the content of the `target`. For example:
```xml
<trans-unit id="d3233bd79e5ab0f7f5e9600bb5b8ef470bdb4bc6" datatype="html">
  <source>Add group ...</source>
  <!--Replace only the target with the translation -->
  <target state="translated">Ajouter un groupe ...</target>
  <note priority="1" from="description">Add a new school group</note>
  <context-group purpose="location">
    <context context-type="sourcefile">src/app/child-dev-project/attendance/activity-participants-section/activity-participants-section.component.html</context>
    <context context-type="linenumber">21</context>
  </context-group>
  <context-group purpose="location">
    <context context-type="sourcefile">src/app/child-dev-project/notes/note-details/note-details.component.html</context>
    <context context-type="linenumber">169</context>
  </context-group>
</trans-unit>
```
You can change the state to "translated" (but this is not required). 
Leave everything else as it is and test the app again. Translations should appear for each 
trans-unit that you have translated.
