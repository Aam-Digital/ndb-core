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

import { TestBed } from '@angular/core/testing';

import { LatestChangesService } from './latest-changes.service';
import {AlertService} from '../alerts/alert.service';
import {HttpClient} from '@angular/common/http';
import {of, throwError} from 'rxjs';
import { MatDialogModule } from '@angular/material/dialog';
import {CookieService} from 'ngx-cookie-service';

describe('LatestChangesService', () => {

  let service: LatestChangesService;

  let alertService: AlertService;
  let http: HttpClient;

  beforeEach(() => {
    alertService = new AlertService(null, null);
    http = new HttpClient(null);

    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        LatestChangesService,
        CookieService,
        {provide: AlertService, useValue: alertService},
        {provide: HttpClient, useValue: http},
      ]
    });

    service = TestBed.get(LatestChangesService);
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return changelog array', (done) => {
    spyOn(http, 'get').and
      .returnValue(of([{ name: 'test', tag_name: 'v1.0', body: 'latest test', published_at: '2018-01-01'}]));
    service.getChangelogs()
      .subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('test');
        done();
      });
  });

  it('should add Alert on failing to get changelog', (done) => {
    spyOn(http, 'get').and
      .returnValue(throwError({ status: 404, message: 'not found' }));
    const alertSpy = spyOn(alertService, 'addAlert');
    service.getChangelogs()
      .subscribe(() => {}, (err) => {
        expect(alertSpy.calls.count()).toBe(1, 'no Alert message created');
        done();
      });
  });
});
