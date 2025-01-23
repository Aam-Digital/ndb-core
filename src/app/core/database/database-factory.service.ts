import { inject, Injectable } from "@angular/core";
import { Database } from "./database";
import { PouchDatabase } from "./pouch-database";
import { KeycloakAuthService } from "../session/auth/keycloak/keycloak-auth.service";
import { environment } from "../../../environments/environment";
import { SessionType } from "../session/session-type";

/**
 * Provides a method to generate Database instances.
 *
 * (can be re-implemented to cater to different Database implementations).
 */
@Injectable({
  providedIn: "root",
})
export class DatabaseFactoryService {
  private authService = inject(KeycloakAuthService);

  createDatabase(): Database {
    return new PouchDatabase(this.authService);
  }

  initDatabase(db: Database, dbName: string): void {
    if (db instanceof PouchDatabase) {
      if (environment.session_type === SessionType.mock) {
        db.initInMemoryDB(dbName);
      } else {
        db.initIndexedDB(dbName);
      }
    }
  }
}
