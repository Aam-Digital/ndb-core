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

@NgModule({
  providers: [
    LoggingService,
    {
      provide: Database,
      useFactory: (loggingService: LoggingService) =>
        new PouchDatabase(loggingService).initIndexedDB(),
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
  ],
})
export class DatabaseTestingModule {}
