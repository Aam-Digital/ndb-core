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

import { Component, Input, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MarkdownPageConfig } from "../MarkdownPageConfig";
import { RouteData } from "../../view/dynamic-routing/view-config.interface";
import { RouteTarget } from "../../../app.routing";
import { MarkdownModule } from "ngx-markdown";
import { MarkdownPageModule } from "../markdown-page.module";

/**
 * Display markdown formatted page that is dynamically loaded based on the file defined in config.
 */
@RouteTarget("MarkdownPage")
@Component({
  selector: "app-markdown-page",
  templateUrl: "./markdown-page.component.html",
  imports: [MarkdownModule, MarkdownPageModule],
  standalone: true,
})
export class MarkdownPageComponent implements OnInit {
  /** filepath to be loaded as markdown */
  @Input() markdownFile: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.data.subscribe(
      (data: RouteData<MarkdownPageConfig>) =>
        (this.markdownFile = data.config.markdownFile),
    );
  }
}
