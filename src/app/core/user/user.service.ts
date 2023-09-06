import { Injectable } from "@angular/core";
import { AuthUser } from "../session/session-service/auth-user";

@Injectable({
  providedIn: "root",
})
export class UserService {
  user: AuthUser;

  getCurrentUser(): AuthUser {
    return this.user;
  }
}
