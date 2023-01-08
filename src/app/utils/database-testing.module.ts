import { NgModule } from "@angular/core";
import { PouchDatabase } from "../core/database/pouch-database";
import { SessionService } from "../core/session/session-service/session.service";
import { LocalSession } from "../core/session/session-service/local-session";
import { ConfigService } from "../core/config/config.service";
import { SessionType } from "../core/session/session-type";
import { environment } from "../../environments/environment";
import { createTestingConfigService } from "../core/config/testing-config-service";
import { AppModule } from "../app.module";
import { ComponentRegistry } from "../dynamic-components";

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
    { provide: SessionService, useClass: LocalSession },
    { provide: ConfigService, useValue: createTestingConfigService() },
  ],
})
export class DatabaseTestingModule {
  constructor(pouchDatabase: PouchDatabase, components: ComponentRegistry) {
    components.allowDuplicates();
    environment.session_type = SessionType.mock;
    pouchDatabase.initInMemoryDB();
  }
}
