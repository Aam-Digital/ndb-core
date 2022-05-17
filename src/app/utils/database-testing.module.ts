import { NgModule } from "@angular/core";
import { Database } from "../core/database/database";
import { PouchDatabase } from "../core/database/pouch-database";
import { LoggingService } from "../core/logging/logging.service";
import { EntityMapperService } from "../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../core/entity/schema/entity-schema.service";
import { SessionService } from "../core/session/session-service/session.service";
import { LocalSession } from "../core/session/session-service/local-session";
import { DatabaseIndexingService } from "../core/entity/database-indexing/database-indexing.service";
import {
  entityRegistry,
  EntityRegistry,
} from "../core/entity/database-entity.decorator";
import {
  viewRegistry,
  ViewRegistry,
} from "../core/view/dynamic-components/dynamic-component.decorator";
import { RouteRegistry, routesRegistry } from "../app.routing";
import {
  ConfigService,
  createTestingConfigService,
} from "../core/config/config.service";

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
  providers: [
    LoggingService,
    {
      provide: Database,
      useFactory: (loggingService: LoggingService) =>
        new PouchDatabase(loggingService).initInMemoryDB(),
      deps: [LoggingService],
    },
    EntityMapperService,
    EntitySchemaService,
    {
      provide: SessionService,
      useFactory: (database: PouchDatabase) => new LocalSession(database),
      deps: [Database],
    },
    DatabaseIndexingService,
    { provide: EntityRegistry, useValue: entityRegistry },
    { provide: ViewRegistry, useValue: viewRegistry },
    { provide: RouteRegistry, useValue: routesRegistry },
    { provide: ConfigService, useValue: createTestingConfigService() },
  ],
})
export class DatabaseTestingModule {}
