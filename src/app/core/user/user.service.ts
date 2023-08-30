import { Injectable } from "@angular/core";
import { AuthUser } from "../session/session-service/auth-user";
import { LoginStateSubject } from "../session/session-type";
import { waitForChangeTo } from "../session/session-states/session-utils";
import { LoginState } from "../session/session-states/login-state.enum";
import { LocalSession } from "../session/session-service/local-session";
import { RemoteSession } from "../session/session-service/remote-session";

@Injectable({
  providedIn: "root",
})
export class UserService {
  user: AuthUser;
  constructor(
    loginState: LoginStateSubject,
    localSession: LocalSession,
    remoteSession: RemoteSession,
  ) {
    loginState.pipe(waitForChangeTo(LoginState.LOGGED_IN)).subscribe(() => {
      this.user =
        remoteSession.getCurrentUser() ?? localSession.getCurrentUser();
    });
  }

  getCurrentUser(): AuthUser {
    return this.user;
  }
}
