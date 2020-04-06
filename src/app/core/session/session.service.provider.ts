/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { SyncedSessionService } from './session-service/synced-session.service';
import { AppConfig } from '../app-config/app-config';
import { MockSessionService } from './session-service/mock-session.service';
import { SessionService } from './session-service/session.service';
import { AlertService } from '../alerts/alert.service';
import { EntitySchemaService } from 'app/core/entity/schema/entity-schema.service';

/**
 * Factory method for Angular DI provider of SessionService.
 *
 * see [sessionServiceProvider]{@link sessionServiceProvider} for details.
 *
 * @param alertService
 * @param entitySchemaService
 */
export function sessionServiceFactory(alertService: AlertService, entitySchemaService: EntitySchemaService): SessionService {
  if (AppConfig.settings.database.useTemporaryDatabase) {
    return new MockSessionService(entitySchemaService);
  } else {
    return new SyncedSessionService(alertService, entitySchemaService);
  }
}

/**
 * Provider for SessionService implementation based on the AppConfig settings.
 *
 * Set `"database": { "useTemporaryDatabase": true }` in your app-config.json
 * to use the MockSessionService which will set up an in-memory database with demo data.
 * Otherwise the SyncedSessionService is used, establishing a local and remote session and setting up sync between them.
 */
export const sessionServiceProvider = {
  provide: SessionService,
  useFactory: sessionServiceFactory,
  deps: [AlertService, EntitySchemaService],
};
