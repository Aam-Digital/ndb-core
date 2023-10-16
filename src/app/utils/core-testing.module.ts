import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import {
  entityRegistry,
  EntityRegistry,
} from "../core/entity/database-entity.decorator";
import { EntityMapperService } from "../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../core/entity/entity-mapper/mock-entity-mapper-service";
import { ConfigurableEnumService } from "../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { EntityRemoveService } from "../core/entity/entity-remove.service";
import { ComponentRegistry } from "../dynamic-components";

/**
 * A basic module that can be imported in unit tests to provide default datatypes.
 * In contrast to MockedTestingModule this imports a much more limited set of modules.
 */
@NgModule({
  imports: [CoreModule],
  providers: [
    { provide: EntityRegistry, useValue: entityRegistry },
    { provide: EntityMapperService, useValue: mockEntityMapper() },
    {
      provide: ConfigurableEnumService,
      useValue: new ConfigurableEnumService(mockEntityMapper(), null),
    },
    {
      provide: EntityRemoveService,
      useValue: jasmine.createSpyObj(["anonymize"]),
    },
    { provide: EntityRemoveService, useValue: null },
    ComponentRegistry,
  ],
})
export class CoreTestingModule {
  constructor(components: ComponentRegistry) {
    components.allowDuplicates();
  }
}
