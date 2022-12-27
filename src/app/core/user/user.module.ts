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
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { CommonModule } from "@angular/common";
import { MatLegacyTabsModule as MatTabsModule } from "@angular/material/legacy-tabs";
import { TabStateModule } from "../../utils/tab-state/tab-state.module";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { Angulartics2Module } from "angulartics2";
import { ReactiveFormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { SessionModule } from "../session/session.module";
import { UserSecurityComponent } from "./user-security/user-security.component";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";

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
    TabStateModule,
    MatTooltipModule,
    Angulartics2Module,
    ReactiveFormsModule,
    FontAwesomeModule,
    SessionModule,
    MatSelectModule,
  ],
  declarations: [UserAccountComponent, UserSecurityComponent],
  exports: [UserSecurityComponent],
})
export class UserModule {
  dynamicComponents = [UserSecurityComponent];
}
