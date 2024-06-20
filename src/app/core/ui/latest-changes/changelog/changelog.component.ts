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
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { isObservable, Observable } from "rxjs";
import { LatestChangesService } from "../latest-changes.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MarkdownService } from "ngx-markdown";
import { MarkedRendererCustom } from "./MarkedRendererCustom";

/**
 * Display information from the changelog for the latest version.
 *
 * This component is used as content of a dialog.
 */
@UntilDestroy()
@Component({
  templateUrl: "./changelog.component.html",
  styleUrls: ["./changelog.component.scss"],
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
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Observable<Changelog[]>,
    private latestChangesService: LatestChangesService,
    private markdownService: MarkdownService,
  ) {}

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
    this.markdownService.renderer.list = customRenderer.list;
  }
}
