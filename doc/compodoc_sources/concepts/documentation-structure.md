# Documentation Structure

Our documentation is structured into four different approaches,
following the concept laid out at **<www.divio.com/blog/documentation>**:

1. TUTORIALS
   - learning-oriented
   - allow the newcomer to get started
   - are lessons
   - _Analogy: teaching a small child how to cook_
2. HOW-TO GUIDES
   - goal-oriented
   - show how to solve a specific problem
   - are a series of steps
   - _Analogy: a recipe in a cookery book_
3. CONCEPTS
   - understanding-oriented
   - explain
   - provide background and context
   - _Analogy: an article on culinary social history_
4. REFERENCE
   - information-oriented
   - describe the machinery
   - accurate and complete
   - _Analogy: a reference encyclopaedia article_

A good reference and repository of documentation templates also is
[The Good Docs Project](https://thegooddocsproject.dev/).

## How the documentation is generated

The _Developer Documentation_ (which you are reading here) is generated using
[compodoc](https://github.com/compodoc/compodoc/):

- **Tutorials, How-To Guides and Concepts** are written explicitly as Markdown files.
  They live either under `doc/compodoc_sources` or as `README.md` files next to the code
  they describe, and are registered in `doc/compodoc_sources/summary.json`.
- **The API Reference** (the _Modules_, _Classes_, etc. sections) is generated automatically
  from JSDoc code comments.

The documentation is regenerated and published from `master` automatically via CI.

## How to contribute documentation

- **Document your code with JSDoc.** New code should be documented as soon as you write or
  edit it, and your Pull Request should include that documentation. For the correct comment
  format see the [compodoc comment guide](https://compodoc.app/guides/comments.html).
- **To add or edit an article** (like this page), edit the relevant Markdown file under
  `doc/compodoc_sources` or the `README.md` next to the code. When you add a new Markdown file,
  also register it in `doc/compodoc_sources/summary.json`.
- **To preview locally**, run `npm run compodoc` (see `package.json`). The online documentation
  is usually the more convenient reference, though.
