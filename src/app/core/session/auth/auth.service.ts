import { HttpHeaders } from "@angular/common/http";
import { DatabaseUser } from "../session-service/local-user";

export abstract class AuthService {
  abstract authenticate(
    username: string,
    password: string
  ): Promise<DatabaseUser>;

  abstract autoLogin(): Promise<DatabaseUser>;

  abstract addAuthHeader(headers: HttpHeaders);

  abstract logout(): Promise<void>;

  abstract changePassword(): Promise<any>;
}
