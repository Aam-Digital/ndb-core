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
import { AlertService } from "../alerts/alert.service";
import { HttpClient } from "@angular/common/http";
import { of, throwError } from "rxjs";

describe("LatestChangesService", () => {
  let service: LatestChangesService;

  let alertService: AlertService;
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
  ];

  beforeEach(() => {
    alertService = new AlertService(null);
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

  it("should return changelog of current version", (done) => {
    spyOn(http, "get").and.returnValue(of(testReleases));

    service.getChangelogsBetweenVersions("1.1").subscribe((result) => {
      expect(result.length).toBe(1);
      expect(result[0].name).toBe(testReleases[1].name);
      done();
    });
  });

  it("should return changelogs between versions excluding previous version", (done) => {
    spyOn(http, "get").and.returnValue(of(testReleases));

    service.getChangelogsBetweenVersions("2.0", "1.0").subscribe((result) => {
      expect(result.length).toBe(2);
      expect(result[0].name).toBe(testReleases[0].name);
      expect(result[1].name).toBe(testReleases[1].name);
      done();
    });
  });

  it("should return changelogs before version", (done) => {
    spyOn(http, "get").and.returnValue(of(testReleases));

    service.getChangelogsBeforeVersion("2.0", 3).subscribe((result) => {
      expect(result.length).toBe(2); // cannot return more results than available at api
      expect(result[0].name).toBe(testReleases[1].name);
      expect(result[1].name).toBe(testReleases[2].name);
      done();
    });
  });

  it("should return empty array if no releases from api", (done) => {
    spyOn(http, "get").and.returnValue(of([]));

    service.getChangelogsBetweenVersions("1.0").subscribe((result) => {
      expect(result.length).toBe(0);
      done();
    });
  });

  it("should add Alert on failing to get changelog", (done) => {
    spyOn(http, "get").and.returnValue(
      throwError({ status: 404, message: "not found" })
    );
    const alertSpy = spyOn(alertService, "addAlert");
    service.getChangelogsBetweenVersions("1.0").subscribe(
      () => {},
      (err) => {
        expect(alertSpy.calls.count()).toBe(1, "no Alert message created");
        done();
      }
    );
  });
});
