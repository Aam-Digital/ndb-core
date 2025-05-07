import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import {
  entityRegistry,
  EntityRegistry,
} from "../core/entity/database-entity.decorator";
import { EntityMapperService } from "../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../core/entity/entity-mapper/mock-entity-mapper-service";
import { ConfigurableEnumService } from "../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ComponentRegistry } from "../dynamic-components";
import { EntityActionsService } from "../core/entity/entity-actions/entity-actions.service";
import { ConfigurableEnumModule } from "../core/basic-datatypes/configurable-enum/configurable-enum.module";
import { EntityAbility } from "../core/permissions/ability/entity-ability";
import { EntitySchemaService } from "../core/entity/schema/entity-schema.service";
import { defaultValueStrategyProviders } from "../core/default-values/standard-default-value-strategies";

/**
 * A basic module that can be imported in unit tests to provide default datatypes.
 * In contrast to MockedTestingModule this imports a much more limited set of modules.
 */
@NgModule({
  imports: [CoreModule, ConfigurableEnumModule],
  providers: [
    { provide: EntityRegistry, useValue: entityRegistry },
    { provide: EntityMapperService, useValue: mockEntityMapper() },
    {
      provide: ConfigurableEnumService,
      useValue: new ConfigurableEnumService(mockEntityMapper(), null),
    },
    {
      provide: EntityActionsService,
      useValue: jasmine.createSpyObj(["anonymize"]),
    },
    EntitySchemaService,
    EntityAbility,
    ComponentRegistry,
    ...defaultValueStrategyProviders,
  ],
})
export class CoreTestingModule {
  constructor(components: ComponentRegistry) {
    components.allowDuplicates();
  }
}
