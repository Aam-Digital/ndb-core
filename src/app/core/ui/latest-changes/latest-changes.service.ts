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

import { catchError, map } from "rxjs/operators";
import { Injectable, inject } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { Changelog } from "./changelog";
import { AlertService } from "../../alerts/alert.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";

/**
 * Manage the changelog information and display it to the user
 * on request or automatically on the first visit of a new version after update.
 */
@Injectable({ providedIn: "root" })
export class LatestChangesService {
  private http = inject(HttpClient);
  private alertService = inject(AlertService);

  private static GITHUB_API = "https://api.github.com/repos/";

  /**
   * Load the changelog information of changes since the last update.
   * @param currentVersion The current version for which changes are to be loaded.
   * @param previousVersion (Optional) The older version since which changes of all versions until the currentVersion will be loaded.
   */
  getChangelogsBetweenVersions(
    currentVersion: string,
    previousVersion?: string,
  ): Observable<Changelog[]> {
    return this.getChangelogs((releases) =>
      this.filterReleasesBetween(releases, currentVersion, previousVersion),
    );
  }

  private filterReleasesBetween(
    releases: Changelog[],
    currentVersion: string,
    previousVersion?: string,
  ) {
    const releasesUpToCurrentVersion = releases.filter(
      (r) => this.compareVersion(r.tag_name, currentVersion) <= 0,
    );
    if (releasesUpToCurrentVersion.length < 1) {
      return [];
    }

    if (previousVersion) {
      return releasesUpToCurrentVersion
        .filter((r) => this.compareVersion(r.tag_name, previousVersion) > 0)
        .sort((a, b) => this.compareVersion(b.tag_name, a.tag_name));
    } else {
      return [releasesUpToCurrentVersion[0]];
    }
  }

  /**
   * Load the changelog information of a number of releases before (excluding) the given version.
   * @param version The version for which preceding releases should be returned.
   * @param count The number of releases before the given version to be returned
   */
  getChangelogsBeforeVersion(
    version: string,
    count: number,
  ): Observable<Changelog[]> {
    return this.getChangelogs((releases: Changelog[]) =>
      this.filterReleasesBefore(releases, version, count),
    );
  }

  private filterReleasesBefore(
    releases: Changelog[],
    version: string,
    count: number,
  ) {
    return releases
      .filter((r) => (version ? r.tag_name < version : true))
      .sort((a, b) => this.compareVersion(b.tag_name, a.tag_name))
      .slice(0, count);
  }

  private compareVersion(a: string, b: string) {
    return a.localeCompare(b, "en", { numeric: true });
  }

  /**
   * Load release information from GitHub based on a given filter to select relevant releases.
   * @param releaseFilter Filter function that is selecting relevant objects from the array of GitHub releases
   */
  private getChangelogs(
    releaseFilter: (releases: Changelog[]) => Changelog[],
  ): Observable<Changelog[]> {
    return this.http
      .get<
        Changelog[]
      >(`${LatestChangesService.GITHUB_API}${environment.repositoryId}/releases`)
      .pipe(
        map(excludePrereleases),
        map(releaseFilter),
        map((relevantReleases) =>
          relevantReleases.map((r) => this.parseGithubApiRelease(r)),
        ),
        catchError((error) => {
          this.alertService.addWarning(
            $localize`Could not load latest changes: ${error}`,
          );
          return throwError(() => new Error("Could not load latest changes."));
        }),
      );

    function excludePrereleases(releases: Changelog[]): Changelog[] {
      return releases.filter(
        (release) => !release.prerelease && !release.draft,
      );
    }
  }

  private parseGithubApiRelease(githubResponse: Changelog): Changelog {
    const cleanedReleaseNotes = githubResponse.body
      .replace(
        // remove heading
        /#{1,2}[^###]*/,
        "",
      )
      .replace(
        // remove commit refs
        / \(\[\w{7}\]\([^\)]*\)\)/g,
        "",
      )
      .replace(
        // remove lines starting with "." after markdown characters
        /^(\*|\#)* *\.(.*)(\n|\r\n)/gm,
        "",
      )
      .replace(
        // contains "**core:** as scope
        /^(.*)\*\*core:\*\*(.*)(\n|\r\n)/gm,
        "",
      );

    return {
      tag_name: githubResponse.tag_name,
      name: githubResponse.name,
      published_at: githubResponse.published_at,
      body: cleanedReleaseNotes,
    };
  }
}
