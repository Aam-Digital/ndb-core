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
import { NavigationComponent } from "./navigation/navigation.component";
import { SessionModule } from "../session/session.module";
import { RouterModule } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Angulartics2Module } from "angulartics2";
import { ConfigModule } from "../config/config.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

/**
 * Manages the main app navigation menu
 * which can dynamically be configured through the {@link NavigationItemsService}.
 */
@NgModule({
  imports: [
    CommonModule,
    SessionModule,
    RouterModule,
    MatListModule,
    MatButtonModule,
    MatTooltipModule,
    Angulartics2Module,
    ConfigModule,
    FontAwesomeModule,
  ],
  declarations: [NavigationComponent],
  exports: [NavigationComponent],
  providers: [],
})
export class NavigationModule {}
