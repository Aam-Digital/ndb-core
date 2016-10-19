import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import '../rxjs-operators';
import { Changelog } from './changelog';

@Injectable()
export class LatestChangesService {

    constructor(private http: Http) {
    }

    getChangelog(): Observable<Changelog[]> {
        return this.http.get('app/changelog.json')
            .map((response) => response.json())
            .catch((error) => Observable.throw('Could not load latest changes.'));
    }
}
