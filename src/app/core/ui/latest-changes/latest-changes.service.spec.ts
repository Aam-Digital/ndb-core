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

import { TestBed } from "@angular/core/testing";

import { LatestChangesService } from "./latest-changes.service";
import { AlertService } from "../../alerts/alert.service";
import { HttpClient } from "@angular/common/http";
import { of, throwError } from "rxjs";
import type { Mock } from "vitest";

type AlertServiceMock = Pick<AlertService, "addWarning"> & {
  addWarning: Mock;
};

describe("LatestChangesService", () => {
  let service: LatestChangesService;

  let alertService: AlertServiceMock;
  let http: HttpClient;

  const testReleases = [
    {
      name: "test 2",
      tag_name: "2.0",
      body: "C",
      published_at: "2018-01-01",
    },
    {
      name: "test 1b",
      tag_name: "1.1",
      body: "B",
      published_at: "2018-01-01",
    },
    {
      name: "test 1",
      tag_name: "1.0",
      body: "A",
      published_at: "2018-01-01",
    },
    {
      name: "prerelease 1",
      tag_name: "1.0-rc.1",
      prerelease: true,
      body: "A",
      published_at: "2018-01-01",
    },
  ];

  beforeEach(() => {
    alertService = {
      addWarning: vi.fn(),
    };
    http = new HttpClient(null);

    TestBed.configureTestingModule({
      providers: [
        LatestChangesService,
        { provide: AlertService, useValue: alertService },
        { provide: HttpClient, useValue: http },
      ],
    });

    service = TestBed.inject<LatestChangesService>(LatestChangesService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return changelog of current version", async () => {
    vi.spyOn(http, "get").mockReturnValue(of(testReleases));

    service.getChangelogsBetweenVersions("1.1").subscribe((result) => {
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(testReleases[1].name);
    });
  });

  it("should return changelogs between versions excluding previous version", async () => {
    vi.spyOn(http, "get").mockReturnValue(of(testReleases));

    service.getChangelogsBetweenVersions("2.0", "1.0").subscribe((result) => {
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe(testReleases[0].name);
      expect(result[1].name).toBe(testReleases[1].name);
    });
  });

  it("should return changelogs before version", async () => {
    vi.spyOn(http, "get").mockReturnValue(of(testReleases));

    service.getChangelogsBeforeVersion("2.0", 3).subscribe((result) => {
      expect(result.length).toBe(2); // cannot return more results than available at api
      expect(result[0].name).toBe(testReleases[1].name);
      expect(result[1].name).toBe(testReleases[2].name);
    });
  });

  it("should return empty array if no releases from api", async () => {
    vi.spyOn(http, "get").mockReturnValue(of([]));

    service.getChangelogsBetweenVersions("1.0").subscribe((result) => {
      expect(result).toHaveLength(0);
    });
  });

  it("should add Alert on failing to get changelog", async () => {
    vi.spyOn(http, "get").mockReturnValue(
      throwError(() => ({ status: 404, message: "not found" })),
    );

    service.getChangelogsBetweenVersions("1.0").subscribe({
      error: () => {
        expect(
          alertService.addWarning,
          '"not found" error not defined',
        ).toHaveBeenCalledTimes(1);
      },
    });
  });

  it("should not include prereleases", async () => {
    vi.spyOn(http, "get").mockReturnValue(of(testReleases));

    service.getChangelogsBeforeVersion("1.1", 10).subscribe((result) => {
      expect(result).toEqual([testReleases[2]]);
      expect(result[0]["prerelease"]).toBeFalsy();
      expect(result).not.toContain(testReleases[3]);
    });
  });

  it("should remove lines from release changelog body that are explicitly hidden by starting with a '.'", async () => {
    const testRelease = {
      name: "test with notes",
      tag_name: "3.0",
      body: `changelog
### Bugs
* relevant fix
* .hidden fix
* **core:** hidden core item
### .Hidden
`,
    };

    vi.spyOn(http, "get").mockReturnValue(of([testRelease]));

    service.getChangelogsBetweenVersions("3.0", "2.9").subscribe((result) => {
      expect(result[0].tag_name).toBe(testRelease.tag_name);
      expect(result[0].body).toBe(`changelog
# Bugs
* relevant fix
`);
    });
  });

  it("should remove irrelevant details from release changelog body", async () => {
    const testRelease = {
      name: "test with notes",
      tag_name: "3.0",
      body: "* fix ([e03dcca](https://github.com/Aam-Digital/ndb-core/commit/e03dcca7d89e584b8f08cc7fe30621c1ad428dba))",
    };

    vi.spyOn(http, "get").mockReturnValue(of([testRelease]));

    service.getChangelogsBetweenVersions("3.0", "2.9").subscribe((result) => {
      expect(result[0].tag_name).toBe(testRelease.tag_name);
      expect(result[0].body).toBe("* fix");
    });
  });
});
