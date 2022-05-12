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

import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityMapperService } from "./entity-mapper.service";
import { EntitySchemaService } from "./schema/entity-schema.service";
import { EntityConfigService } from "./entity-config.service";
import { entityRegistry, EntityRegistry } from "./database-entity.decorator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

/**
 * Generic system to manage saving and loading documents with the database
 * while offering certain transformations between the object and the database representation.
 * A key part of this is to return instances of {@link Entity} subclasses to other modules of the app
 * which can simply treat them as normal javascript class instances without worrying about database persistance logic.
 *
 * The main service used by other modules is {@link EntityMapperService}, which provides functions to load, save and query
 * data from the database (and return it after transformation to the correct Entity instances).
 *
 * The Entity schema system allows you to use annotations in the Entity classes to define which properties
 * are saved to the database, how they are transformed and which properties are ignored when writing to the database.
 * This is handled by the {@link EntitySchemaService} (which is internally used by the EntityMapperService.
 * You can register your own custom data-type transformations with the EntitySchemaService as well.
 *
 * To understand how to use the Entity system in your own modules, refer to the How-To Guides:
 * - [How to Load and Save Data]{@link /additional-documentation/how-to-guides/load-and-save-data.html}
 * - [How to Create a new Entity Type]{@link /additional-documentation/how-to-guides/create-a-new-entity-type.html}
 */
@NgModule({
  imports: [CommonModule],
  providers: [
    EntityMapperService,
    EntitySchemaService,
    EntityConfigService,
    { provide: EntityRegistry, useValue: entityRegistry },
  ],
})
export class EntityModule {}
