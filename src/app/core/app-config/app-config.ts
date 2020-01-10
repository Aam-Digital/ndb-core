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
import { IAppConfig } from './app-config.model';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AppConfig {
  static settings: IAppConfig;
  readonly DEFAULT_CONFIG_FILE = 'assets/config.default.json';

  constructor(private http: HttpClient) {}

  load() {
    const configFile = 'assets/config.json';
    return this.loadAppConfigJson(configFile)
      .then((result) => result,
        () => this.loadAppConfigJson(this.DEFAULT_CONFIG_FILE));
  }

  private loadAppConfigJson(jsonFileLocation: string) {
    return new Promise<void>((resolve, reject) => {
      this.http.get<IAppConfig>(jsonFileLocation).toPromise()
        .then((result) => {
          AppConfig.settings = result;
          resolve();
        })
        .catch((response: any) => {
          reject(`Could not load file '${jsonFileLocation}': ${JSON.stringify(response)}`);
        });
    });
  }
}
