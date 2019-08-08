#Documentation for Developer- how to contribute
* with every push to the master, travis generates this Documentation of the Project via Compodoc automatically. **All you have to do is to Comment your code with basic JSDoc!** Further information: https://compodoc.app/guides/comments.html
* New code should always be documented while writing!
* If you want to **add or edit separate additional documentation** like this page, work on branch compodoc and edit the markdown files under doc/compodoc_sources. Make sure to kee the summary.json up-to-date.

###additional information
* the script "compodoc" in the package.json is used by travis to generate the documentation!
* Install compodoc manually with npm i -save -dev @compodoc/compodoc
* run compodoc manually (you should instead use the documentation provided online!) with npm run compodoc (this calls the script compodoc in the package.json).
