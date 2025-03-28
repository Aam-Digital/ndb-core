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

import { Component, inject, Input, OnInit } from "@angular/core";
import { MarkdownPageModule } from "../markdown-page.module";
import { RouteTarget } from "../../../route-target";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MarkdownContent } from "../markdown-content";

/**
 * Display markdown formatted page that is dynamically loaded based on the file defined in config.
 */
@RouteTarget("MarkdownPage")
@Component({
  selector: "app-markdown-page",
  templateUrl: "./markdown-page.component.html",
  imports: [MarkdownPageModule],
})
export class MarkdownPageComponent implements OnInit {
  /** filepath to be loaded as markdown */
  @Input() markdownFile?: string;
  /** markdown entity content to be displayed */
  @Input() markdownEntityId?: string;

  markdownContent: string = "";

  private entityMapper = inject(EntityMapperService);

  async ngOnInit(): Promise<void> {
    if (this.markdownEntityId) {
      const markdownEntity = await this.entityMapper.load(
        MarkdownContent,
        this.markdownEntityId,
      );

      if (markdownEntity) {
        this.markdownContent = markdownEntity.content;
      }
    }
  }
}
