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

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Changelog } from './changelog';
import {AlertService} from '../alerts/alert.service';
import {HttpClient} from '@angular/common/http';
import {ErrorObservable} from 'rxjs-compat/observable/ErrorObservable';

@Injectable()
export class LatestChangesService {

  constructor(private http: HttpClient,
              private alertService: AlertService) {
  }

  getChangelogs(): Observable<Changelog[]> {
    return this.http.get<Changelog[]>('assets/changelog.json')
      .map((response) => response)
      .catch((error) => {
        this.alertService.addWarning('Could not load latest changes: ' + error);
        return ErrorObservable.create('Could not load latest changes.');
      });
  }

  getCurrentVersion(): Observable<string> {
    return this.getChangelogs().map(changelog => changelog[0].tag_name);
  }
}
