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

import { Component, Inject, LOCALE_ID } from "@angular/core";

/**
 * Display markdown formatted help that is dynamically loaded from a file in the assets folder.
 * Displayed file: assets/How_To.md
 */
@Component({
  selector: "app-help",
  templateUrl: "./how-to.component.html",
  styleUrls: ["./how-to.component.scss"],
})
export class HowToComponent {
  constructor(@Inject(LOCALE_ID) public locale: string) {}
  get src(): string {
    if (this.locale === "en-US") {
      return "assets/How_To.md";
    } else {
      return `assets/locale/How_To.${this.locale}.md`;
    }
  }
}
