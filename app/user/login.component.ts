import {Component} from 'angular2/core';

import {SessionService} from "./session.service";


@Component({
    selector: 'ndb-login',
    templateUrl: 'app/user/login.component.html'
})
export class LoginComponent {
    loginInProgress = false;
    username:string;
    password:string;
    errorMessage:string;

    constructor(private _sessionService:SessionService) {
    }

    login() {
        this.loginInProgress = true;
        this._sessionService.login(this.username, this.password)
            .then(success => success ? this.onLoginSuccess() : this.onLoginFailure("username or password incorrect"))
            .catch(reason => this.onLoginFailure(reason));
    }

    private onLoginSuccess() {
        // login component is automatically hidden based on _sessionService.isLoggedIn()

        //TODO: show progress of downloading database (if necessary)
        //TODO: call service to check and warn about outdated database
        //TODO: call service to check version and display changelog of updates
    }

    private onLoginFailure(reason) {
        this.errorMessage = reason;
        this.password = "";
        this.loginInProgress = false;
    }
}
