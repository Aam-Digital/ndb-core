import {Injectable, EventEmitter} from '@angular/core';
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs/Observable";
import {AlertService} from "../alerts/alert.service";

import 'rxjs/Rx';
import {Changelog} from "./changelog";

@Injectable()
export class LatestChangesService {

    constructor(private http: Http,
                private _alertService: AlertService) {
    }

    checkForNewVersion(lastKnownVersion: string): boolean {
        // TODO create version model?
        // TODO compare current release version to last known version
        return true;
    }

    getChangelog(): Observable<Changelog[]> {

        console.log("Getting release details...");

        return this.http.get("app/changelog.json")
            .map((response) => response.json())
            .catch((error) => {
                console.log("Could not load latest changes.");
                this._alertService.addDanger("test");
                return Observable.throw("Could not load latest changes.");
            });
    }
}
