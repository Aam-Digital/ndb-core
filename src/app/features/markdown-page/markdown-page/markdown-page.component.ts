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

import {
  Component,
  inject,
  ChangeDetectionStrategy,
  effect,
  input,
  signal,
} from "@angular/core";
import { MarkdownPageModule } from "../markdown-page.module";
import { RouteTarget } from "../../../route-target";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MarkdownContent } from "../markdown-content";

/**
 * Display markdown formatted page that is dynamically loaded based on the file defined in config.
 */
@RouteTarget("MarkdownPage")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-markdown-page",
  templateUrl: "./markdown-page.component.html",
  imports: [MarkdownPageModule],
})
export class MarkdownPageComponent {
  /** filepath to be loaded as markdown */
  markdownFile = input<string>();
  /** markdown entity content to be displayed */
  markdownEntityId = input<string>();

  markdownContent = signal<string>("");

  private entityMapper = inject(EntityMapperService);

  constructor() {
    effect((onCleanup) => {
      const markdownEntityId = this.markdownEntityId();
      if (!markdownEntityId) {
        this.markdownContent.set("");
        return;
      }

      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      void this.loadEntityContent(markdownEntityId, () => cancelled);
    });
  }

  private async loadEntityContent(
    entityId: string,
    isCancelled: () => boolean,
  ): Promise<void> {
    const markdownEntity = await this.entityMapper.load(
      MarkdownContent,
      entityId,
    );
    if (isCancelled()) {
      return;
    }
    this.markdownContent.set(markdownEntity?.content ?? "");
  }
}
