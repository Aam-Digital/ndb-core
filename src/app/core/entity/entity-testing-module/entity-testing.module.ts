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

import { ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityMapperService } from "../entity-mapper.service";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { EntityConfigService } from "../entity-config.service";
import { Entity } from "../entity";
import { Database } from "../../database/database";
import { MockDatabase } from "../../database/mock-database";
import { SessionService } from "../../session/session-service/session.service";
import { MockSessionService } from "../../session/session-service/mock-session.service";
import { AppConfig } from "../../app-config/app-config";
import { SessionType } from "../../session/session-type";

/**
 * Utility module for complex unit test and storybook scenarios.
 *
 * Import this with an array of entities to set up all required dependencies to use EntityMapper with a MockDatabase.
 *
 * PLEASE NOTE:
 * If feasible, you should rather mock an individual service directly in your unit tests
 * because this gives you better independence of your test and more flexibility to simulate different scenarios.
 * This EntityTestingModule is intended to make it easier to set up some level of integration tests.
 */
@NgModule({
  imports: [CommonModule],
  declarations: [],
  providers: [EntityMapperService, EntitySchemaService, EntityConfigService],
})
export class EntityTestingModule {
  static withData(
    entities: Entity[]
  ): ModuleWithProviders<EntityTestingModule> {
    if (!AppConfig.settings) {
      AppConfig.settings = {
        session_type: SessionType.mock,
        database: {
          name: "",
          remote_url: "",
        },
        site_name: "",
      };
    }

    return {
      ngModule: EntityTestingModule,
      providers: [
        {
          provide: Database,
          useValue: MockDatabase.createWithData(entities),
        },
        {
          provide: SessionService,
          useValue: MockSessionService,
        },
      ],
    };
  }
}
