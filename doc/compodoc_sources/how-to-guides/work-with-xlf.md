# How to edit, update and work with XLF files

"xlf-files" are the files generated by the `extract-i18n` script. They conform to the
[XLIFF Standard](http://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html) (Version 1.2)

## How to create XLF files

You create XLF files automatically when you specify a new language. For details on how
this works, have a look at the [Add another Language](add-another-language.md) guide.

## How to update XLF files

We are using the POEditor platform to manage translations through a UI.
GitHub Actions send the XLF files to POEditor and pull the translations back into the project.

## Available Tools

There are several tools that can be used to translated in a graphically appealing way.
This is an incomplete list of some of these tools:

- [Online XLIFF Editor](https://xliff.brightec.co.uk): A free editor that has limited
  capabilities
- [PO Editor](https://poeditor.com/kb/xliff-editor): A capable editor that you need an
  acount for but is limited to 1000 strings with a free account
- [Lokalize](https://app.lokalise.com/project/8086894060bb7d5eb21109.79604392/?view=multi):
  A tool that highlights `<x .../>` tags which prevents a user to accidentally delete them
  but lacks other features. Limited free version
- [OmegaT](https://omegat.org): A free tool for Windows, Mac and Linux with limited
  capabilities

## Manual Translation

You can also do this manually in the XLF Document. The process is as follows:

1. Find the file for your locale, named `messages.<locale>.xlf`. They can be found
   in the [locale](src/locale) folder. This file consists of several 'trans-unit's.
   Each of them consists of several sections. Here is an example of such a trans unit for german (`de`)
   ```xml
   <trans-unit id="2c2620b14c4290b8f8c0c90abc6b6b17bff06ec6" datatype="html">
     <source>class <x id="INTERPOLATION" equiv-text="{{ entity?.schoolClass }}"/></source>
     <target state="translated">Klasse <x id="INTERPOLATION" equiv-text="{{ entity?.schoolClass }}"/></target>
     <context-group purpose="location">
       <context context-type="sourcefile">src/app/child-dev-project/children/child-block/child-block.component.html</context>
       <context context-type="linenumber">34</context>
     </context-group>
     <note priority="1" from="description">e.g. 'class 8'</note>
     <note priority="1" from="meaning">The class a child is attending</note>
   </trans-unit>
   ```
  - Inside the `trans-unit` we see the two tags `id` and `datatype`. The `id` is a unique id
    that belongs to this trans unit. It can also be a custom, more descriptive id. In most
    cases, this is a generated id that you should pay no attention to when translating.
  - The `datatype` is always `html`, disregarding regardless of whether this actually came
    from an `html` file.
  - The `source` is the text that should be translated. This may not be altered.
  - The `target` is the translation. Any special elements, such as `<x ... />` must not be
    changed. The content of them can be ignored. Additionally, a `state` can be associated
    with a translation. There are two common states: `new` and `translated` indicating that
    a new message has been added and has not been translated resp. that a message has already
    been translated. Additional states can be found at the website of the standard.
  - The `context-group` contains information where the text got extracted from. It can be
    ignored and must not be changed.
  - Further notes are attached to trans units in order to ease the translation process.
    You should also not change them, but they will be helpful.
2. Translate the `target` of all trans units.
