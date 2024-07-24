# How to document code

Our _Developer Documentation_ (which you are also currently reading here) is generated using [compodoc](https://github.com/compodoc/compodoc/).

While the How-To Guides and Concepts are explicitly written
the API Reference (what you see in the sections _Modules_, _Classes_ etc.) is generated from JsDoc code comments.

Therefore, whenever you write new code, please also document it with appropriate code comments.

> also read about our overall [Documentation Structure & Approach](../concepts/documentation-structure.html)

## Instructions

- With every push to the master, travis generates this documentation of the project automatically.
  **All you have to do is to Comment your code with basic JSDoc!** \* For the correct comment format read https://compodoc.app/guides/comments.html
- New code should always be documented as soon as you write or edit it.
  Your Pull Request should include documentation.
- If you want to **add or edit separate additional documentation** like this page, work on branch compodoc and edit the markdown files under doc/compodoc_sources.
  If you add a new markdown file you also have to add it to summary.json.

### Additional Information

- `npm run compodoc` (see package.json) is used by Travis CI to generate the documentation.
- You can also run `npm run compodoc` manually. You should better use the documentation provided online, however.
