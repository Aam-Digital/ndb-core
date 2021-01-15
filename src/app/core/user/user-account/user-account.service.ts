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
   * Function to change the
   * @param user The user for which the password should be changed
   * @param oldPassword The current plaintext password of the user
   * @param newPassword The new plaintext password of the user
   * @return Promise that resolves once the password is changed in _user and the database
   */
  public changePassword(
    user: User,
    oldPassword: string,
    newPassword: string
  ): Promise<any> {
    const headers: HttpHeaders = new HttpHeaders();
    headers.append(
      "Authorization",
      "Basic " + btoa(user.name + ":" + oldPassword)
    );
    const userUrl = UserAccountService.COUCHDB_USER_ENDPOINT + ":" + user.name;

    return this.http
      .get(userUrl, { headers: headers })
      .toPromise()
      .then((userResponse) => {
        userResponse["password"] = newPassword;
        user.setNewPassword(newPassword);
        return Promise.all([
          this.http
            .put(userUrl, userResponse, { headers: headers })
            .toPromise(),
          this.entityMapper.save<User>(user),
        ]);
      });
  }
}
