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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChildDetailsComponent } from './child-details/child-details.component';
import {ChildListComponent} from './child-list/child-list.component';
import { Ng2TableModule } from 'ng2-table/ng2-table';
import { Ng2SmartTableModule } from 'ng2-smart-table';


@NgModule({
  imports: [
    CommonModule,
    Ng2TableModule,
    Ng2SmartTableModule
  ],
  declarations: [ChildDetailsComponent, ChildListComponent]
})
export class ChildrenModule { }
