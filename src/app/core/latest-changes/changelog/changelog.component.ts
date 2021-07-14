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
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { isObservable, Observable } from "rxjs";
import { LatestChangesService } from "../latest-changes.service";

/**
 * Display information from the changelog for the latest version.
 *
 * This component is used as content of a dialog.
 */
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
   *
   * @param dialogRef Reference to the parent dialog.
   * @param data Changelog data to be display initially
   * @param latestChangesService
   */
  constructor(
    public dialogRef: MatDialogRef<ChangelogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Observable<Changelog[]>,
    private latestChangesService: LatestChangesService
  ) {}

  ngOnInit(): void {
    if (this.data && isObservable(this.data)) {
      this.data.subscribe((changelog) => (this.changelogs = changelog));
    }
  }

  /**
   * Add one more previous release card to the end of the currently displayed list of changelogs.
   */
  loadPreviousRelease() {
    const lastDisplayedVersion =
      this.changelogs[this.changelogs.length - 1].tag_name;
    this.latestChangesService
      .getChangelogsBeforeVersion(lastDisplayedVersion, 1)
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
