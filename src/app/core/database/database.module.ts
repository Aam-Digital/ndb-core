import { NgModule } from "@angular/core";
import { PouchDatabase } from "./pouch-database";
import { Database } from "./database";

/**
 * This module provides the `Database` injectable.
 * Inject `Database` in you class if you need to directly access this service.
 *
 * Currently, this is always a `PouchDatabase` but this might change in the future.
 * Therefore, the `PouchDatabase` should only be injected with special care (and when it's really, really necessary).
 */
@NgModule({
  providers: [PouchDatabase, { provide: Database, useExisting: PouchDatabase }],
})
export class DatabaseModule {}
