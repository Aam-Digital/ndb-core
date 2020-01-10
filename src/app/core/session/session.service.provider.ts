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

import { SyncedSessionService } from './synced-session.service';
import { AppConfig } from '../app-config/app-config';
import { MockSessionService } from './mock-session.service';
import { SessionService } from './session.service';
import { AlertService } from '../alerts/alert.service';
import { EntitySchemaService } from 'app/core/entity/schema/entity-schema.service';

export function sessionServiceFactory(alertService: AlertService, entitySchemaService: EntitySchemaService): SessionService {
  if (AppConfig.settings.database.useTemporaryDatabase) {
    return new MockSessionService(entitySchemaService);
  } else {
    return new SyncedSessionService(alertService, entitySchemaService);
  }
}

export const sessionServiceProvider = {
  provide: SessionService,
  useFactory: sessionServiceFactory,
  deps: [AlertService, EntitySchemaService]
};
