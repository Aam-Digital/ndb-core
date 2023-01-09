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
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { PhotoDatatype } from "./child-photo-service/datatype-photo";
import { ComponentRegistry } from "../../dynamic-components";
import { childrenComponents } from "./children-components";

@NgModule({})
export class ChildrenModule {
  constructor(
    entitySchemaService: EntitySchemaService,
    components: ComponentRegistry
  ) {
    entitySchemaService.registerSchemaDatatype(new PhotoDatatype());
    components.addAll(childrenComponents);
  }
}
