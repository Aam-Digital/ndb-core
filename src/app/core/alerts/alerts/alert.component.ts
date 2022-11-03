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

import { Component, Inject } from "@angular/core";

import { Alert } from "../alert";
import { MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";

/**
 * Display an {@link Alert} with basic formatting and UI controls.
 */
@Component({
  templateUrl: "./alert.component.html",
  styleUrls: ["./alert.component.scss"],
})
export class AlertComponent {
  /**
   * This component is created through MatSnackBar which provides the required data during creation.
   * @param alert The alert instance to be displayed
   */
  constructor(@Inject(MAT_SNACK_BAR_DATA) public alert: Alert) {}
}
