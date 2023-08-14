import { Injectable } from "@angular/core";
import { AuthService } from "../auth.service";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpStatusCode,
} from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { AppSettings } from "../../../app-config/app-settings";
import { AuthUser } from "../../session-service/auth-user";
import { tap } from "rxjs/operators";

@Injectable()
export class CouchdbAuthService extends AuthService {
  private static readonly COUCHDB_USER_ENDPOINT = `${AppSettings.DB_PROXY_PREFIX}/_users/org.couchdb.user`;

  constructor(private http: HttpClient) {
    super();
  }

  addAuthHeader() {
    // auth happens through cookie
    return;
  }

  authenticate(username: string, password: string): Promise<AuthUser> {
    return firstValueFrom(
      this.http
        .post<AuthUser>(
          `${AppSettings.DB_PROXY_PREFIX}/_session`,
          { name: username, password: password },
          { withCredentials: true },
        )
        .pipe(tap(() => this.logSuccessfulAuth())),
    );
  }

  autoLogin(): Promise<any> {
    return firstValueFrom(
      this.http.get<{ userCtx: AuthUser }>(
        `${AppSettings.DB_PROXY_PREFIX}/_session`,
        { withCredentials: true },
      ),
    ).then((res: any) => {
      if (res.userCtx.name) {
        this.logSuccessfulAuth();
        return res.userCtx;
      } else {
        throw new HttpErrorResponse({
          status: HttpStatusCode.Unauthorized,
        });
      }
    });
  }

  /**
   * Function to change the password of a user
   * @param username The username for which the password should be changed
   * @param oldPassword The current plaintext password of the user
   * @param newPassword The new plaintext password of the user
   * @return Promise that resolves once the password is changed in _user and the database
   */
  public async changePassword(
    username?: string,
    oldPassword?: string,
    newPassword?: string,
  ): Promise<void> {
    let userResponse;
    try {
      // TODO due to cookie-auth, the old password is actually not checked
      userResponse = await this.getCouchDBUser(username, oldPassword);
    } catch (e) {
      throw new Error("Current password incorrect or server not available");
    }

    userResponse.password = newPassword;
    try {
      await this.saveNewPasswordToCouchDB(username, oldPassword, userResponse);
    } catch (e) {
      throw new Error(
        "Could not save new password, please contact your system administrator",
      );
    }
  }

  private getCouchDBUser(username: string, password: string): Promise<any> {
    const userUrl = CouchdbAuthService.COUCHDB_USER_ENDPOINT + ":" + username;
    const headers: HttpHeaders = new HttpHeaders({
      Authorization: "Basic " + btoa(username + ":" + password),
    });
    return firstValueFrom(this.http.get(userUrl, { headers: headers }));
  }

  private saveNewPasswordToCouchDB(
    username: string,
    oldPassword: string,
    userObj: any,
  ): Promise<any> {
    const userUrl = CouchdbAuthService.COUCHDB_USER_ENDPOINT + ":" + username;
    const headers: HttpHeaders = new HttpHeaders({
      Authorization: "Basic " + btoa(username + ":" + oldPassword),
    });
    return firstValueFrom(
      this.http.put(userUrl, userObj, { headers: headers }),
    );
  }

  logout(): Promise<any> {
    return firstValueFrom(
      this.http.delete(`${AppSettings.DB_PROXY_PREFIX}/_session`, {
        withCredentials: true,
      }),
    );
  }
}
