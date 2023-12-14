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

import { Component, Input } from "@angular/core";
import { MarkdownPageModule } from "../markdown-page.module";
import { RouteTarget } from "../../../route-target";

/**
 * Display markdown formatted page that is dynamically loaded based on the file defined in config.
 */
@RouteTarget("MarkdownPage")
@Component({
  selector: "app-markdown-page",
  templateUrl: "./markdown-page.component.html",
  imports: [MarkdownPageModule],
  standalone: true,
})
export class MarkdownPageComponent {
  /** filepath to be loaded as markdown */
  @Input() markdownFile: string;
}
