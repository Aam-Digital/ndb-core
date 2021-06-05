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
differ based on where the app should be shipped to. For example, English is spoken differently
in the US (`en-US`), Great-Britain (`en-GB`) or Australia (`en-AU`).
A list of available country codes can be found [here](https://www.iso.org/obp/ui/#search/code/).
Once you have the language and country code, the resulting code is _language code_-_country code_.

###2) Add the language to the list of known languages
The file [angular.json](angular.json) contains all available languages. In this file, look for the
`i18n` section. Add the language code from the last step (possible including the region code) 
as a key to the `locales` section. Specify the path `src/locale/messages.<your locale>.xlf` as 
the value. Don't create that file yet - this will be done automatically in the next steps. 
For example, if you wanted to add the French language, this is what the `i18n` section should look like:

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
standardized file that translators can work with. The standard that we use is `xlf`.

To generate a file, simply use the script `extract-i18n` located inside the [package.json](package.json)
file. This will automatically generate the needed file if none exists

###5) [Optional] Update the nginx config for the dockerfile
We can build the Project using Docker. In order to build the app in every known locale
(at least for testing purposes) add the following lines to the nginx config inside the
server section. For example, for french:
```nginx configuration
location /fr/ {
    autoindex on;
    try_files $uri$args $uri$args/ /fr/index.html=404;
}
```

###6) Test your build
In production, all (or a subset of all) available languages are build. However, when testing,
you can only use one language to avoid too complex dev builds. You can set the language
that you would like to develop in inside the [angular.json](angular.json) file at the section
`projects/ndb-core/architect/build`. Find the option `localize` and replace the existing language
with the language that you just created. It should look like this for French:
```json
...
"polyfills": "src/polyfills.ts",
"localize": ["fr"],
...
```
Run the app. If you have not added translations, the app will be in english. 
Try to translate some units. 

In order to do this, go to the newly created `src/locale/messages.<locale>.xlf` file. 
Inside this file, you will find a lot of"trans-units". These mark single texts that 
you can translate. Translate one or more of these units by replacing the content of 
the `target`. For example:
```xml
<trans-unit id="08c74dc9762957593b91f6eb5d65efdfc975bf48" datatype="html">
  <source>Username</source>
  <target state="translated">Nom d'utilisateur</target>
  <context-group purpose="location">
    <context context-type="sourcefile">src/app/core/admin/user-list/user-list.component.html</context>
    <context context-type="linenumber">7,8</context>
  </context-group>
  <context-group purpose="location">
    <context context-type="sourcefile">src/app/core/session/login/login.component.html</context>
    <context context-type="linenumber">32</context>
  </context-group>
  <context-group purpose="location">
    <context context-type="sourcefile">src/app/core/user/user-account/user-account.component.html</context>
    <context context-type="linenumber">26</context>
  </context-group>
</trans-unit>
```
You can change the state to "translated" as shown in the picture (but this is not required). 
Leave everything else as it is and test the app again. Translations should appear for each 
trans-unit that you have translated.

A more detailed overview can be found in Guide
[How to edit, update and work with XLF files](work-with-xlf.md).

###Conclusion
You have now successfully added the capability to translate the app into the target
language. You can now take the translation file (`"src/locale/messages.<your locale>.xlf"`) and 
send it to a translator to have it translated. Once this process is done, replace the
preliminary translation file with the one that comes back from a translator.
