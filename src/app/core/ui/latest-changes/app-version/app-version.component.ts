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

import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { LatestChangesDialogService } from "../latest-changes-dialog.service";

/**
 * Simple component displaying the current app version
 * including functionality to open an info dialog showing the latest change when the user clicks on it.
 */
@Component({
  selector: "app-version",
  templateUrl: "./app-version.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppVersionComponent implements OnInit {
  /** the current app version */
  currentVersion: string;

  constructor(private changelogDialog: LatestChangesDialogService) {}

  ngOnInit(): void {
    this.currentVersion = this.changelogDialog.getCurrentVersion();
  }

  /**
   * Open dialog box to display changelog information about the latest version to the user.
   */
  public showLatestChanges(): void {
    this.changelogDialog.showLatestChanges();
  }
}
