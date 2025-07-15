import { inject, NgModule } from "@angular/core";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { entityRegistry } from "../core/entity/database-entity.decorator";
import { ConfigService } from "../core/config/config.service";
import { AbilityService } from "../core/permissions/ability/ability.service";
import { EMPTY, Subject } from "rxjs";
import { EntityAbility } from "../core/permissions/ability/entity-ability";
import { defineAbility } from "@casl/ability";
import { provideTestingConfigService } from "../core/config/testing-config-service";
import { componentRegistry } from "../dynamic-components";
import { AppModule } from "../app.module";
import { Entity } from "../core/entity/model/entity";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../core/entity/entity-mapper/entity-mapper.service";
import { DatabaseIndexingService } from "../core/entity/database-indexing/database-indexing.service";
import { EntityConfigService } from "../core/entity/entity-config.service";
import { TEST_USER } from "../core/user/demo-user-generator.service";
import { RouterTestingModule } from "@angular/router/testing";

componentRegistry.allowDuplicates();
entityRegistry.allowDuplicates();

export const entityFormStorybookDefaultParameters = {
  controls: {
    exclude: ["_columns", "_cols", "enumValueToString"],
  },
};

/**
 * Utility module to be imported in Storybook stories to ensure central setup like fontawesome icons are available.
 */
@NgModule({
  declarations: [],
  imports: [AppModule, RouterTestingModule],
  providers: [
    { provide: ConfigService, useValue: provideTestingConfigService() },
    {
      provide: AbilityService,
      useValue: {
        abilityUpdated: new Subject<void>(),
        initializeRules: () => {},
      },
    },
    {
      provide: EntityAbility,
      useValue: defineAbility((can) => can("manage", "all")),
    },
    {
      provide: DatabaseIndexingService,
      useValue: {
        createIndex: () => {},
        queryIndexDocsRange: () => Promise.resolve([]),
        queryIndexDocs: () => Promise.resolve([]),
        indicesRegistered: EMPTY,
      },
    },
    ...mockEntityMapperProvider(),
  ],
})
export class StorybookBaseModule {
  private static initData: Entity[] = [];

  static withData(data: Entity[] = [new Entity(TEST_USER)]) {
    StorybookBaseModule.initData = data;
    return StorybookBaseModule;
  }

  constructor() {
    const icons = inject(FaIconLibrary);
    const entityMapper = inject(EntityMapperService);
    const entityConfigService = inject(EntityConfigService);

    (entityMapper as MockEntityMapperService).addAll(
      StorybookBaseModule.initData,
    );
    icons.addIconPacks(fas, far);
    entityConfigService.setupEntitiesFromConfig();
  }
}
