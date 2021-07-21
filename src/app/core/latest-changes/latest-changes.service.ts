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
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { Changelog } from "./changelog";
import { AlertService } from "../alerts/alert.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

/**
 * Manage the changelog information and display it to the user
 * on request or automatically on the first visit of a new version after update.
 */
@Injectable()
export class LatestChangesService {
  private static GITHUB_API = "https://api.github.com/repos/";

  constructor(private http: HttpClient, private alertService: AlertService) {}

  /**
   * Load the changelog information of changes since the last update.
   * @param currentVersion The current version for which changes are to be loaded.
   * @param previousVersion (Optional) The older version since which changes of all versions until the currentVersion will be loaded.
   */
  getChangelogsBetweenVersions(
    currentVersion: string,
    previousVersion?: string
  ): Observable<Changelog[]> {
    return this.getChangelogs((releases: any[]) =>
      this.filterReleasesBetween(releases, currentVersion, previousVersion)
    );
  }

  private filterReleasesBetween(
    releases: any[],
    currentVersion: string,
    previousVersion?: string
  ) {
    let relevantReleases;

    const releasesUpToCurrentVersion = releases.filter(
      (r) => r.tag_name <= currentVersion
    );
    if (releasesUpToCurrentVersion.length < 1) {
      return [];
    }

    if (previousVersion) {
      const releasesBackToPreviousVersion = releasesUpToCurrentVersion.filter(
        (r) => r.tag_name > previousVersion
      );
      relevantReleases = releasesBackToPreviousVersion.sort((a, b) =>
        (b.tag_name as string).localeCompare(a.tag_name, "en")
      );
    } else {
      relevantReleases = [releasesUpToCurrentVersion[0]];
    }

    return relevantReleases;
  }

  /**
   * Load the changelog information of a number of releases before (excluding) the given version.
   * @param version The version for which preceding releases should be returned.
   * @param count The number of releases before the given version to be returned
   */
  getChangelogsBeforeVersion(
    version: string,
    count: number
  ): Observable<Changelog[]> {
    return this.getChangelogs((releases: any) =>
      this.filterReleasesBefore(releases, version, count)
    );
  }

  private filterReleasesBefore(
    releases: any[],
    version: string,
    count: number
  ) {
    let relevantReleases;

    const releasesUpToCurrentVersion = releases.filter(
      (r) => r.tag_name < version
    );
    if (releasesUpToCurrentVersion.length < 1) {
      return [];
    }

    relevantReleases = releasesUpToCurrentVersion.sort((a, b) =>
      (b.tag_name as string).localeCompare(a.tag_name, "en")
    );
    return relevantReleases.slice(0, count);
  }

  /**
   * Load release information from GitHub based on a given filter to select relevant releases.
   * @param releaseFilter Filter function that is selecting relevant objects from the array of GitHub releases
   */
  private getChangelogs(releaseFilter: ([]) => any[]): Observable<Changelog[]> {
    return this.http
      .get<any[]>(
        LatestChangesService.GITHUB_API + environment.repositoryId + "/releases"
      )
      .pipe(
        map(releaseFilter),
        map((relevantReleases) =>
          relevantReleases.map((r) => this.parseGithubApiRelease(r))
        ),
        catchError((error) => {
          this.alertService.addWarning(
            $localize`Could not load latest changes: ${error}`
          );
          return throwError("Could not load latest changes.");
        })
      );
  }

  private parseGithubApiRelease(githubResponse: any): Changelog {
    const releaseNotesWithoutHeading = githubResponse.body.replace(
      /#{1,2}[^###]*/,
      ""
    );
    const releaseNotesWithoutCommitRefs = releaseNotesWithoutHeading.replace(
      / \(\[\w{7}\]\([^\)]*\)\)/g,
      ""
    );

    return {
      tag_name: githubResponse.tag_name,
      name: githubResponse.name,
      published_at: githubResponse.published_at,
      body: releaseNotesWithoutCommitRefs,
    };
  }
}
