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
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { Changelog } from "../changelog";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { isObservable, Observable } from "rxjs";
import { LatestChangesService } from "../latest-changes.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DatePipe, NgForOf, NgIf } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MarkdownPageModule } from "../../markdown-page/markdown-page.module";
import { MarkdownModule } from "ngx-markdown";
import { MatButtonModule } from "@angular/material/button";

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
    MatDialogModule,
    NgForOf,
    FontAwesomeModule,
    DatePipe,
    MarkdownModule,
    NgIf,
    MarkdownPageModule,
    MatButtonModule,
  ],
  standalone: true,
})
export class ChangelogComponent implements OnInit {
  /** The array of relevant changelog entries to be displayed */
  changelogs: Changelog[];

  /** Display advanced information that may not be useful to normal users */
  showAdvancedDetails = false;

  @ViewChild("changelogContainer") contentContainer: ElementRef;

  /**
   * This component is to be created through a MatDialog that should pass in the relevant data.
   *
   * @example
   * dialog.open(ChangelogComponent, { data: { changelogData: latestChangesService.getChangelogs() } });
   *
   * @param data Changelog data to be display initially
   * @param latestChangesService
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Observable<Changelog[]>,
    private latestChangesService: LatestChangesService
  ) {}

  ngOnInit(): void {
    if (isObservable(this.data)) {
      this.data
        .pipe(untilDestroyed(this))
        .subscribe((changelog) => (this.changelogs = changelog));
    }
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
}
