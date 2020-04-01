# How to Write Developer Documentation (compodoc)
* With every push to the master, travis generates this Documentation of the Project via Compodoc automatically.
**All you have to do is to Comment your code with basic JSDoc!**
Further information: https://compodoc.app/guides/comments.html
* New code should always be documented as soon as you write or edit it.
Your Pull Request should include documentation.
* If you want to **add or edit separate additional documentation** like this page, work on branch compodoc and edit the markdown files under doc/compodoc_sources.
 If you add a new markdown file you also have to add it to summary.json.

### Additional Information
* `npm run compodoc` (see package.json) is used by Travis CI to generate the documentation.
* Install compodoc manually with `npm i -save -dev @compodoc/compodoc`
* You can also run `npm run compodoc` manually. You should better use the documentation provided online, however.
