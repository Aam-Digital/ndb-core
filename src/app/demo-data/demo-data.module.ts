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

import {EntityModule} from '../entity/entity.module';
import {DemoDataService} from './demo-data.service';
import {NgModule} from '@angular/core';
import {DemoSchoolGenerator} from './demo-school-generator.service';
import {DemoChildGenerator} from './demo-child-generator.service';
import {DemoChildSchoolRelationGenerator} from './demo-child-school-relation-generator';

@NgModule({
  imports: [
    EntityModule,
  ],
  declarations: [],
  providers: [
    DemoDataService,
    DemoChildGenerator.provider(150),
    DemoSchoolGenerator.provider(8),
    DemoChildSchoolRelationGenerator.provider(),
  ]
})
export class DemoDataModule {
}
