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

import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseModule } from '../database/database.module';
import { EntityMapperService } from './entity-mapper.service';
import {EntitySchemaService} from './schema/entity-schema.service';

@NgModule({
  imports: [
    CommonModule,
    DatabaseModule
  ],
  declarations: [],
  providers: [
    EntityMapperService,
    EntitySchemaService,
  ]
})
export class EntityModule {
}
