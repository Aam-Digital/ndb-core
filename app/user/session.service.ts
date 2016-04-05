import { Injectable } from 'angular2/core';

import { User } from "./user";


@Injectable()
export class SessionService {
    currentUser: User = null;

    tmp = 0;

    isLoggedIn() : boolean {
        return this.currentUser != null;
    }

    login(username:string, password:string) {
        //TODO: remove login demo
        if(password && this.tmp < 1) {
            this.tmp++;
            return Promise.reject( "Login failed. Try again (this mock login will pass on second try)" );
        }

        this.currentUser = new User();
        this.currentUser.name = username;



        //TODO: login on local database
        //TODO: login on remote database

        return Promise.resolve();
    }
}
