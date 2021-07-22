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
import { UiComponent } from "./ui/ui.component";
import { NavigationModule } from "../navigation/navigation.module";
import { SessionModule } from "../session/session.module";
import { SyncStatusModule } from "../sync-status/sync-status.module";
import { RouterModule } from "@angular/router";
import { LatestChangesModule } from "../latest-changes/latest-changes.module";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { SearchComponent } from "./search/search.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ChildrenModule } from "../../child-dev-project/children/children.module";
import { SchoolsModule } from "../../child-dev-project/schools/schools.module";
import { FlexLayoutModule } from "@angular/flex-layout";
import { PrimaryActionComponent } from "./primary-action/primary-action.component";
import { NotesModule } from "../../child-dev-project/notes/notes.module";
import { Angulartics2Module } from "angulartics2";
import { PermissionsModule } from "../permissions/permissions.module";
import { EntityUtilsModule } from "../entity-components/entity-utils/entity-utils.module";
import { TranslationModule } from "../translation/translation.module";

/**
 * The core user interface structure that ties different components together into the overall app layout.
 */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    LatestChangesModule,
    NavigationModule,
    RouterModule,
    SessionModule,
    SyncStatusModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    FlexLayoutModule,
    ChildrenModule,
    SchoolsModule,
    NotesModule,
    Angulartics2Module,
    PermissionsModule,
    EntityUtilsModule,
    ReactiveFormsModule,
    TranslationModule,
  ],
  declarations: [SearchComponent, UiComponent, PrimaryActionComponent],
  exports: [UiComponent],
})
export class UiModule {}
