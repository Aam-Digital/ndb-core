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
import { UpdateManagerService } from "./update-manager.service";

import { LOCATION_TOKEN } from "../../utils/di-tokens";

/**
 * Displaying app version and changelog information to the user
 * through components that can be used in other templates
 * as well as automatic popups on updates (see {@link UpdateManagerService}, {@link LatestChangesService}).
 *
 * Changelogs are dynamically loaded from GitHub Releases through the GitHub API.
 * pre-releases are excluded and individual lines in the body can be hidden by starting
 * text (after markdown characters) with a ".".
 */
@NgModule({
  providers: [{ provide: LOCATION_TOKEN, useValue: window.location }],
})
export class LatestChangesModule {
  constructor(private updateManagerService: UpdateManagerService) {
    this.updateManagerService.notifyUserWhenUpdateAvailable();
    this.updateManagerService.regularlyCheckForUpdates();
    this.updateManagerService.detectUnrecoverableState();
  }
}
