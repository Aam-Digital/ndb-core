import { inject, NgModule, provideAppInitializer } from "@angular/core";
import { ConfigService } from "../core/config/config.service";
import { SessionType } from "../core/session/session-type";
import { environment } from "../../environments/environment";
import { AppModule } from "../app.module";
import { ComponentRegistry } from "../dynamic-components";
import { ConfigurableEnumService } from "../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { SwRegistrationOptions } from "@angular/service-worker";
import { EntityConfigService } from "../core/entity/entity-config.service";
import { DatabaseResolverService } from "../core/database/database-resolver.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { getDefaultConfigEntity } from "../core/config/testing-config-service";
import { getDefaultEnumEntities } from "app/core/basic-datatypes/configurable-enum/configurable-enum-testing";
import { firstValueFrom } from "rxjs";

/**
 * Utility module that creates a simple environment where a correctly configured database and session is set up.
 * This can be used in tests where it is important to access a REAL database (e.g. for testing indices/views).
 * If you only use some functions of the EntityMapper then you should rather use the {@link MockedTestingModule}.
 *
 * When using this module, make sure to destroy the Database in `afterEach` in order to have a fresh database in each test:
 * ```javascript
 *  afterEach(() => TestBed.inject(DatabaseResolverService).destroyDatabases());
 * ```
 */
@NgModule({
  imports: [AppModule],
  providers: [
    ConfigService,
    ConfigurableEnumService,
    { provide: SwRegistrationOptions, useValue: { enabled: false } },
    provideAppInitializer(async () => {
      const databaseResolver = inject(DatabaseResolverService);
      const components = inject(ComponentRegistry);
      const entityConfigService = inject(EntityConfigService);
      const entityMapper = inject(EntityMapperService);
      const configService = inject(ConfigService);

      environment.session_type = SessionType.mock;
      databaseResolver.getDatabase().init("test-db");
      components.allowDuplicates();

      await entityMapper.save(getDefaultConfigEntity());
      entityMapper.saveAll(getDefaultEnumEntities());

      // Wait for ConfigService to load config before setting up entities
      // Unit tests don't await AppInitializer (https://github.com/angular/angular/issues/32441)
      await firstValueFrom(configService.configUpdates);
      entityConfigService.setupEntitiesFromConfig();
    }),
  ],
})
export class DatabaseTestingModule {}
