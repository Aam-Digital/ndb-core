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
import { UserAccountComponent } from "./user-account/user-account.component";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { CommonModule } from "@angular/common";
import { MatTabsModule } from "@angular/material/tabs";
import { WebdavModule } from "../webdav/webdav.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatListModule } from "@angular/material/list";
import { FontAwesomeIconsModule } from "../icons/font-awesome-icons.module";
import { UserSelectComponent } from "./user-select/user-select.component";
import { MatAutocompleteModule } from "@angular/material/autocomplete";

/**
 * Provides a User functionality including user account forms.
 */
@NgModule({
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    WebdavModule,
    ReactiveFormsModule,
    MatListModule,
    FontAwesomeIconsModule,
    MatAutocompleteModule,
    FormsModule,
  ],
  declarations: [UserAccountComponent, UserSelectComponent],
  exports: [UserSelectComponent],
})
export class UserModule {}
