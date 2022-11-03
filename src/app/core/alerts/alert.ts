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

import { MatSnackBarRef } from "@angular/material/snack-bar";
import { AlertComponent } from "./alerts/alert.component";
import { AlertDisplay } from "./alert-display";
import { Observable } from "rxjs";

/**
 * An Alert message to be displayed to the user through the {@link AlertService}.
 */
export class Alert {
  /** Info messages provide feedback or information to the user without any required action */
  static INFO = "info";
  /** Warning messages provide feedback about unexpected or potentially unintended events */
  static WARNING = "warning";
  /** Danger messages inform about errors or critical conditions that the user should not overlook */
  static DANGER = "danger";

  /** reference to the ui displaying the message */
  public notificationRef: MatSnackBarRef<AlertComponent>;

  /**
   * Create a container of a new Alert message.
   * @param message The text of the message
   * @param type The type of the message
   * @param display The display style (e.g. whether the alert has to be actively dismissed by the user)
   * @param progress If provided, a progress bar is shown below the message. Should emit numbers between 0 and 100.
   */
  constructor(
    public message: string,
    public type: string,
    public display: AlertDisplay,
    public progress?: Observable<number>
  ) {}
}
