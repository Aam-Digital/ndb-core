import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { Role, UserAccount } from "./user-account";

/**
 * Admin functionalities to manage users in an authentication server like Keycloak.
 */
export abstract class UserAdminService {
  /**
   * Users with this role can create and update other accounts.
   */
  static readonly ACCOUNT_MANAGER_ROLE = "account_manager";

  static readonly API = environment.user_admin_api;

  /**
   * Get the user account details of the user linked to the given entity.
   * @param userEntityId The entity id of the "profile" linked with the account
   */
  abstract getUser(userEntityId: string): Observable<UserAccount>;

  /**
   * Create a user account with the given name and email
   * @param userEntityId The entity id of the "profile" linked with the account
   * @param email
   * @param roles
   */
  abstract createUser(
    userEntityId: string,
    email: string,
    roles: Role[],
  ): Observable<Object>; // TODO: further specify return type

  /**
   * Update the user with the given id in the realm.
   * @param userAccountId The user account id of the authentication server (not the profile entity id)
   * @param updatedUser see {@link https://www.keycloak.org/docs-api/19.0.2/rest-api/index.html#_userrepresentation}
   */
  abstract updateUser(
    userAccountId: string,
    updatedUser: Partial<UserAccount>,
  ): Observable<any>; // TODO: further specify return type

  /**
   * Delete a user with the given id
   * @param userEntityId The entity id of the "profile" linked with the account
   */
  abstract deleteUser(
    userEntityId: string,
  ): Observable<{ userDeleted: boolean }>;

  /**
   * Get all available roles of the server
   */
  abstract getAllRoles(): Observable<Role[]>;
}
