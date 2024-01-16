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

import { NgModule } from "@angular/core";
import { UpdateManagerService } from "./update-manager.service";
import {
  MarkdownModule,
  MARKED_OPTIONS,
  MarkedOptions,
  MarkedRenderer,
} from "ngx-markdown";
import { MarkedRendererCustom } from "./changelog/MarkedRendererCustom";
import { ChangelogComponent } from "./changelog/changelog.component";
import { MatDialogModule } from "@angular/material/dialog";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DatePipe, NgForOf, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";

/**
 * Displaying app version and changelog information to the user
 * through components that can be used in other templates
 * as well as automatic popups on updates (see {@link UpdateManagerService}, {@link LatestChangesService}).
 *
 * Changelogs are dynamically loaded from GitHub Releases through the GitHub API.
 * pre-releases are excluded and individual lines in the body can be hidden by starting
 * text (after markdown characters) with a ".".
 */
@NgModule({
  declarations: [ChangelogComponent],
  imports: [
    MarkdownModule.forRoot({
      markedOptions: {
        provide: MARKED_OPTIONS,
        useFactory: markedOptionsFactory,
      },
    }),
    MatDialogModule,
    FontAwesomeModule,
    DatePipe,
    MatButtonModule,
    NgForOf,
    NgIf,
  ],
})
export class LatestChangesModule {
  constructor(private updateManagerService: UpdateManagerService) {
    this.updateManagerService.listenToAppUpdates();
    this.updateManagerService.regularlyCheckForUpdates();
    this.updateManagerService.detectUnrecoverableState();
  }
}

function markedOptionsFactory(): MarkedOptions {
  const customRenderer = new MarkedRendererCustom();
  const renderer = new MarkedRenderer();
  // Somehow this needs to be assigned manually or the renderer object will not have the functions
  renderer.heading = customRenderer.heading;
  renderer.list = customRenderer.list;

  return {
    renderer: renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
  };
}
