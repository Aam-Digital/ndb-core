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
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { Changelog } from "../changelog";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { isObservable, Observable } from "rxjs";
import { LatestChangesService } from "../latest-changes.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MarkdownModule, MarkdownService } from "ngx-markdown";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DatePipe } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MarkedRendererCustom } from "./MarkedRendererCustom";
import { RouterLink } from "@angular/router";

/**
 * Display information from the changelog for the latest version.
 *
 * This component is used as content of a dialog.
 */
@UntilDestroy()
@Component({
  templateUrl: "./changelog.component.html",
  styleUrls: ["./changelog.component.scss"],
  imports: [
    MarkdownModule,
    MatDialogModule,
    FontAwesomeModule,
    DatePipe,
    MatButtonModule,
    RouterLink,
  ],
})
export class ChangelogComponent implements OnInit {
  data = inject<Observable<Changelog[]>>(MAT_DIALOG_DATA);
  private latestChangesService = inject(LatestChangesService);
  private markdownService = inject(MarkdownService);

  /** The array of relevant changelog entries to be displayed */
  changelogs: Changelog[];

  /** Display advanced information that may not be useful to normal users */
  showAdvancedDetails = false;

  @ViewChild("changelogContainer") contentContainer: ElementRef;

  ngOnInit(): void {
    if (isObservable(this.data)) {
      this.data
        .pipe(untilDestroyed(this))
        .subscribe((changelog) => (this.changelogs = changelog));
    }

    this.customizeMarkdownRenderer();
  }

  get noChangelogAvailable(): string {
    return $localize`No Changelog Available`;
  }

  /**
   * Add one more previous release card to the end of the currently displayed list of changelogs.
   */
  loadPreviousRelease() {
    if (!this.changelogs) {
      return;
    }

    const lastDisplayedVersion =
      this.changelogs[this.changelogs.length - 1]?.tag_name;
    this.latestChangesService
      .getChangelogsBeforeVersion(lastDisplayedVersion, 1)
      .pipe(untilDestroyed(this))
      .subscribe((additionalChangelog) => {
        this.changelogs.push(...additionalChangelog);

        setTimeout(() => this.scrollToBottomOfReleases());
      });
  }

  private scrollToBottomOfReleases() {
    this.contentContainer.nativeElement.scrollTop =
      this.contentContainer.nativeElement.scrollHeight;
  }

  private customizeMarkdownRenderer() {
    const customRenderer = new MarkedRendererCustom();
    this.markdownService.renderer.heading = customRenderer.heading;
  }
}
