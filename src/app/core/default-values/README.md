# Core Module: Default Values

An Entity's fields can have a "default value" configured, which is set while creating a new record (see `EntitySchemaField`).
For advanced modes this value can also be updated later on, when the underlying rule is triggered.

See `DefaultValueConfig` for the structure used in the entity schema.

-----
This core module provides a framework with entrypoints to implement different default value modes.
Each defaultValue mode needs to implement:

1. A config interface that defines the required configuration or rules for service to calculate a default value (the type for `DefaultValueConfig.config`).
2. A service that `extends DefaultValueStrategy` and implements functionality to calculate a default value.
3. A component that `extends CustomFormControlDirective<DefaultValueConfigX>` (where DefaultValueConfigX is your config (1)) and implements form control for the Admin UI that allows users to configure the default value configuration.
  - make sure that this only emits new values when there is a fully valid config, otherwise it should emit `null`.

Provide your service as a multi-provider to register it with this module and make
the Admin UI as well as the service available:

```
{ provide: DefaultValueStrategy, useClass: MyDefaultValueService, multi: true }
```

You currently also need to add your AdminComponent to the `AdminDefaultValueComponent` template manually.
