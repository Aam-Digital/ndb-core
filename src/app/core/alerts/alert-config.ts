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

import { AlertDisplay } from "./alert-display";

export interface AlertConfig {
  /** The text of the message */
  message: string;

  /** The type of the message
   *
   *  - Info messages provide feedback or information to the user without any required action
   *  - Warning messages provide feedback about unexpected or potentially unintended events
   *  - Danger messages inform about errors or critical conditions that the user should not overlook
   */
  type: "info" | "warning" | "danger";

  /** The display style (e.g. whether the alert has to be actively dismissed by the user) */
  display: AlertDisplay;
}

export interface ExtendedAlertConfig extends AlertConfig {
  timestamp: Date;
}
