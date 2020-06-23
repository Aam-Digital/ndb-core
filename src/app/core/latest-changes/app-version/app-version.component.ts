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

import { Component, OnInit } from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { LatestChangesService } from "../latest-changes.service";

/**
 * Simple component displaying the current app version
 * including functionality to open an info dialog showing the latest change when the user clicks on it.
 */
@Component({
  selector: "app-version",
  templateUrl: "./app-version.component.html",
  styleUrls: ["./app-version.component.scss"],
})
export class AppVersionComponent implements OnInit {
  /** the current app version */
  currentVersion: string;

  constructor(
    private _entityMapperService: EntityMapperService,
    private changelog: LatestChangesService
  ) {}

  ngOnInit(): void {
    this.changelog
      .getCurrentVersion()
      .subscribe((version) => (this.currentVersion = version));
  }

  /**
   * Open dialog box to display changelog information about the latest version to the user.
   */
  public showLatestChanges(): void {
    this.changelog.showLatestChanges();
  }
}
