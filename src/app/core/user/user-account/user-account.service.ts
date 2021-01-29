import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { User } from "../user";

@Injectable({
  providedIn: "root",
})
export class UserAccountService {
  private static readonly COUCHDB_USER_ENDPOINT = "/db/_users/org.couchdb.user";
  constructor(
    private http: HttpClient,
    private entityMapper: EntityMapperService
  ) {}

  /**
   * Function to change the password of a user
   * @param user The user for which the password should be changed
   * @param oldPassword The current plaintext password of the user
   * @param newPassword The new plaintext password of the user
   * @return Promise that resolves once the password is changed in _user and the database
   */
  public async changePassword(
    user: User,
    oldPassword: string,
    newPassword: string
  ): Promise<User> {
    if (!user.checkPassword(oldPassword)) {
      throw new Error("Wrong current password");
    }

    const userUrl = UserAccountService.COUCHDB_USER_ENDPOINT + ":" + user.name;
    const headers: HttpHeaders = new HttpHeaders({
      Authorization: "Basic " + btoa(user.name + ":" + oldPassword),
    });
    let userResponse;
    try {
      userResponse = await this.http
        .get(userUrl, { headers: headers })
        .toPromise();
    } catch (e) {
      throw new Error("Current password incorrect or server not available");
    }

    userResponse["password"] = newPassword;
    user.setNewPassword(newPassword);

    try {
      await Promise.all([
        this.http.put(userUrl, userResponse, { headers: headers }).toPromise(),
        this.entityMapper.save<User>(user),
      ]);
    } catch (e) {
      throw new Error(
        "Could not save new password, please contact your system administrator"
      );
    }
    return user;
  }
}
