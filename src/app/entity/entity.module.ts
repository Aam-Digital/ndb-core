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

import {APP_INITIALIZER, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseModule } from '../database/database.module';
import { EntityMapperService } from './entity-mapper.service';
import {EntitySchema} from './schema/entity-schema';
import {stringEntitySchemaDatatype} from './schema/datatype-string';
import {numberEntitySchemaDatatype} from './schema/datatype-number';
import {dateEntitySchemaDatatype} from './schema/datatype-date';
import {monthEntitySchemaDatatype} from './schema/datatype-month';

@NgModule({
  imports: [
    CommonModule,
    DatabaseModule
  ],
  declarations: [],
  providers: [
    EntityMapperService,
    { provide: APP_INITIALIZER, useValue: EntityModule.registerSchemaDatatypes, multi: true }
  ]
})
export class EntityModule {
  static registerSchemaDatatypes(): Promise<any> {
    EntitySchema.registerSchemaDatatype(stringEntitySchemaDatatype);
    EntitySchema.registerSchemaDatatype(numberEntitySchemaDatatype);
    EntitySchema.registerSchemaDatatype(dateEntitySchemaDatatype);
    EntitySchema.registerSchemaDatatype(monthEntitySchemaDatatype);
    return Promise.resolve();
  }
}
