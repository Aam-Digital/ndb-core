import { Injectable } from 'angular2/core';


@Injectable()
export class SessionService {

    isLoggedIn() : boolean {
        return true;
        //TODO: replace stub with real Session/UserService to get authentication status
    }
}
