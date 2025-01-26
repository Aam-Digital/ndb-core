import { NgModule } from "@angular/core";
import { ConfigService } from "../core/config/config.service";
import { SessionType } from "../core/session/session-type";
import { environment } from "../../environments/environment";
import { createTestingConfigService } from "../core/config/testing-config-service";
import { AppModule } from "../app.module";
import { ComponentRegistry } from "../dynamic-components";
import { ConfigurableEnumService } from "../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { createTestingConfigurableEnumService } from "../core/basic-datatypes/configurable-enum/configurable-enum-testing";
import { SwRegistrationOptions } from "@angular/service-worker";
import { EntityConfigService } from "../core/entity/entity-config.service";
import { DatabaseResolverService } from "../core/database/database-resolver.service";

/**
 * Utility module that creates a simple environment where a correctly configured database and session is set up.
 * This can be used in tests where it is important to access a REAL database (e.g. for testing indices/views).
 * If you only use some functions of the EntityMapper then you should rather use the {@link MockedTestingModule}.
 *
 * When using this module, make sure to destroy the Database in `afterEach` in order to have a fresh database in each test:
 * ```javascript
 *  afterEach(() => TestBed.inject(Database).destroy());
 * ```
 */
@NgModule({
  imports: [AppModule],
  providers: [
    { provide: ConfigService, useValue: createTestingConfigService() },
    {
      provide: ConfigurableEnumService,
      useValue: createTestingConfigurableEnumService(),
    },
    { provide: SwRegistrationOptions, useValue: { enabled: false } },
  ],
})
export class DatabaseTestingModule {
  constructor(
    databaseResolver: DatabaseResolverService,
    components: ComponentRegistry,
    entityConfigService: EntityConfigService,
  ) {
    entityConfigService.setupEntitiesFromConfig();
    environment.session_type = SessionType.mock;
    databaseResolver.getDatabase().init("test-db");
    components.allowDuplicates();
  }
}
