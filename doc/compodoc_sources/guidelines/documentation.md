#Documentation for Developers - how to contribute
* with every push to the master, travis generates this Documentation of the Project via Compodoc automatically. **All you have to do is to Comment your code with basic JSDoc!** Further information: https://compodoc.app/guides/comments.html
* New code should always be documented while writing!
* If you want to **add or edit separate additional documentation** like this page, work on branch compodoc and edit the markdown files under doc/compodoc_sources. If you add a new markdown file you also have to add it to summary.json.

###additional information
* the script "compodoc" in the package.json is used by travis to generate the documentation!
* Install compodoc manually with npm i -save -dev @compodoc/compodoc
* run compodoc manually (you should instead use the documentation provided online!) with npm run compodoc (this calls the script compodoc in the package.json).
