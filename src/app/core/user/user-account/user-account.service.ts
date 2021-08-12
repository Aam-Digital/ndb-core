import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class UserAccountService {
  private static readonly COUCHDB_USER_ENDPOINT = "/db/_users/org.couchdb.user";
  constructor(private http: HttpClient) {}

  /**
   * Function to change the password of a user
   * @param username The username for which the password should be changed
   * @param oldPassword The current plaintext password of the user
   * @param newPassword The new plaintext password of the user
   * @return Promise that resolves once the password is changed in _user and the database
   */
  public async changePassword(
    username: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    let userResponse;
    try {
      // TODO due to cookie-auth, the old password is actually not checked
      userResponse = await this.getCouchDBUser(username, oldPassword);
    } catch (e) {
      throw new Error("Current password incorrect or server not available");
    }

    userResponse["password"] = newPassword;
    try {
      await this.saveNewPasswordToCouchDB(username, oldPassword, userResponse);
    } catch (e) {
      throw new Error(
        "Could not save new password, please contact your system administrator"
      );
    }
  }

  private getCouchDBUser(username: string, password: string): Promise<any> {
    const userUrl = UserAccountService.COUCHDB_USER_ENDPOINT + ":" + username;
    const headers: HttpHeaders = new HttpHeaders({
      Authorization: "Basic " + btoa(username + ":" + password),
    });
    return this.http.get(userUrl, { headers: headers }).toPromise();
  }

  private saveNewPasswordToCouchDB(
    username: string,
    oldPassword: string,
    userObj: any
  ): Promise<any> {
    const userUrl = UserAccountService.COUCHDB_USER_ENDPOINT + ":" + username;
    const headers: HttpHeaders = new HttpHeaders({
      Authorization: "Basic " + btoa(username + ":" + oldPassword),
    });
    return this.http.put(userUrl, userObj, { headers: headers }).toPromise();
  }
}
