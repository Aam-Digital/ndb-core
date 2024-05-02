# How to write automated unit tests

We are trying to cover all functionality with unit tests.

The approach is not specific to our project so please refer the available general documentation and tutorials about testing of Angular applications.

The following resources may be helpful:

- [Angular Testing](https://angular.io/guide/testing)
- [Jasmine](https://jasmine.github.io/2.0/introduction.html)

> Our project runs all existing tests whenever you create or update a PR on GitHub
> and checks test coverage (i.e. how much of your code is actually run by the tests you have written).

## Tips & Guidelines

### Mock all dependencies

Unit tests for a class should usually cover that "unit" of code,
i.e. your implementation of that class but not of all the referenced other services.

Try to "mock" all services that your implementation depends on, e.g. using `jasmine.createSpyObj`.
