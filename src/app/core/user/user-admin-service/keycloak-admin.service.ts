import { Injectable, LOCALE_ID, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  catchError,
  concatMap,
  concatWith,
  map,
  switchMap,
} from "rxjs/operators";
import { forkJoin, Observable, of, throwError } from "rxjs";
import { UserAdminApiError, UserAdminService } from "./user-admin.service";
import { KeycloakUserDto } from "./keycloak-user-dto";
import { Logging } from "../../logging/logging.service";
import { Role, UserAccount } from "./user-account";
import { environment } from "../../../../environments/environment";

/**
 * Admin functionalities to manage users in Keycloak server.
 *
 * Requires Keycloak Server with:
 * - Client "app" > Client Scopes > "app-dedicated" > Mappers: "client roles" (to add `"realm-management": { "roles": [] }`) to token
 * - User > Role:
 *     - "(realm-management) manage-users"
 *     - "(realm-management) view-realm" (to access roles)
 *     - ... these can be added as "Associated Roles" to the "account_manager" role so that they do not have to be assigned individually
 */
@Injectable({ providedIn: "root" })
export class KeycloakAdminService extends UserAdminService {
  private http = inject(HttpClient);
  private baseLocale = inject(LOCALE_ID);

  // These roles are created by Keycloak automatically and should not be added or removed from users.
  private static readonly KEYCLOAK_DEFAULT_ROLES = [
    "default-roles",
    "offline_access",
    "uma_authorization",
  ];

  private readonly keycloakUrl: string;

  constructor() {
    super();

    // trim any trailing slashes from the userAdminApi URL
    environment.userAdminApi = environment.userAdminApi?.replace(/\/$/, "");

    this.keycloakUrl = `${environment.userAdminApi}/admin/realms/${environment.realm}`;

    // TODO: Keycloak somehow cannot configure CORS (Access-Control-Allow-Origin) headers for the "realm-management" client
    //   to test locally, run in insecure browser: e.g. `chromium --disable-web-security --user-data-dir=/tmp http://aam.localhost/user`
  }

  override createUser(
    userEntityId: string,
    email: string,
    roles: Role[],
  ): Observable<UserAccount> {
    const newKeycloakUser = new KeycloakUserDto(email, userEntityId);

    return this.http.post(`${this.keycloakUrl}/users`, newKeycloakUser).pipe(
      concatMap(() => this.findUserBy({ username: newKeycloakUser.username })),
      concatMap((userAccount) => {
        return this.assignRoles(userAccount.id, roles).pipe(
          map((roles) => ({ ...userAccount, roles }) as UserAccount),
        );
      }),
      concatMap((userAccount) => {
        return this.sendEmail(userAccount.id, "VERIFY_EMAIL").pipe(
          map(() => userAccount),
        );
      }),
      catchError((originalError) =>
        throwError(() => {
          if (originalError?.status === 409) {
            return new UserAdminApiError(409);
          }
          return this.transformStandardError(originalError);
        }),
      ),
    );
  }

  override deleteUser(
    userEntityId: string,
  ): Observable<{ userDeleted: boolean }> {
    return this.getUser(userEntityId).pipe(
      switchMap((userAccount) => {
        if (!userAccount) {
          Logging.debug("User not found in Keycloak", { userEntityId });
          return of(undefined);
        }
        return this.http.delete(`${this.keycloakUrl}/users/${userAccount.id}`);
      }),
      switchMap(() => {
        return of({ userDeleted: true });
      }),
      catchError((err) => {
        const error = this.transformStandardError(err);
        Logging.warn("failed to delete user account", error, err);
        return of({ userDeleted: false });
      }),
    );
  }

  override updateUser(
    userAccountId: string,
    updatedUser: Partial<UserAccount>,
  ): Observable<{ userUpdated: boolean }> {
    return this.getUserByAccountId(userAccountId).pipe(
      switchMap((userAccount) =>
        this.updateKeycloakUser(
          userAccount,
          KeycloakUserDto.fromUserAccount(updatedUser),
          updatedUser.roles,
        ),
      ),
      map(() => ({ userUpdated: true })),
      catchError((err) => {
        const error = this.transformStandardError(err);
        Logging.warn("Failed to update user on server", error, err);
        return of({ userUpdated: false });
      }),
    );
  }

  private updateKeycloakUser(
    currentUser: KeycloakUserDto,
    updatedUser: Partial<KeycloakUserDto>,
    newRoles?: Role[],
  ) {
    const actions: Observable<any>[] = [];

    if (newRoles) {
      // delete existing roles and assign new ones
      actions.push(
        this.getRolesOfUser(currentUser.id).pipe(
          concatMap((currentRoles) =>
            this.deleteRoles(currentUser.id, currentRoles),
          ),
          concatMap(() => this.assignRoles(currentUser.id, newRoles)),
        ),
      );
    }

    if (updatedUser.email) {
      // send verification email if email changed
      updatedUser.requiredActions = ["VERIFY_EMAIL"];
      actions.push(this.sendEmail(currentUser.id, "VERIFY_EMAIL"));
    }

    // first update the user object, then run other actions
    const newUser = { ...currentUser, ...updatedUser }; // make sure we don't lose unchanged properties
    return this.http
      .put(`${this.keycloakUrl}/users/${currentUser.id}`, newUser)
      .pipe(concatWith(...actions));
  }

  override getUser(userEntityId: string): Observable<UserAccount> {
    return this.findUserBy({
      q: `exact_username:${userEntityId}`,
    }).pipe(
      map(
        (keycloakUser) =>
          ({
            id: keycloakUser.id,
            email: keycloakUser.email,
            emailVerified: keycloakUser.emailVerified,
            enabled: keycloakUser.enabled,
            userEntityId: keycloakUser.attributes?.exact_username?.[0], // the ID is coming in as an array
          }) as UserAccount,
      ),
      switchMap((account) =>
        this.getRolesOfUser(account.id).pipe(
          map((roles) => ({ ...account, roles })),
        ),
      ),
      catchError((originalError) => {
        if (
          originalError instanceof UserAdminApiError &&
          originalError.status === 404
        ) {
          // user not found is a valid use case and not throwing an error
          return of(null);
        }
        return throwError(() => this.transformStandardError(originalError));
      }),
    );
  }

  getUserByAccountId(userAccountId: string) {
    return this.http.get<KeycloakUserDto>(
      `${this.keycloakUrl}/users/${userAccountId}`,
    );
  }

  /**
   * Looks for a single user that matches the criteria in params.
   * The user is only returned if only a single user is matching the criteria exactly.
   * If none or more than one user are matching throws a `NotFoundException`
   * @param params see {@link https://www.keycloak.org/docs-api/19.0.2/rest-api/index.html#_getusers}
   */
  private findUserBy(params: { [key in string]: string | boolean }) {
    params.exact = true;
    return this.findUsersBy(params).pipe(
      map((res) => {
        if (res.length !== 1) {
          throw new UserAdminApiError(404, `Could not find user`);
        } else {
          return res[0];
        }
      }),
    );
  }

  /**
   * Allows to find users by the given criteria.
   * The keys in the `params` object have to be valid Keycloak user properties.
   * Users where all values are matching are returned.
   * @param params
   */
  private findUsersBy(params: { [key in string]: string | boolean }) {
    return this.http.get<KeycloakUserDto[]>(`${this.keycloakUrl}/users`, {
      params,
    });
  }

  /**
   * Sends an email to the user with the given id, asking to perform the specified action.
   * @param userAccountId
   * @param action e.g. "UPDATE_PASSWORD", "VERIFY_EMAIL"
   */
  private sendEmail(userAccountId: string, action: string) {
    return this.http.put(
      `${this.keycloakUrl}/users/${userAccountId}/execute-actions-email`,
      [action],
      {
        headers: {
          "Accept-Language": this.baseLocale,
        },
      },
    );
  }

  getAllRoles(): Observable<Role[]> {
    return this.http
      .get<Role[]>(`${this.keycloakUrl}/roles`)
      .pipe(map((roles) => this.filterNonTechnicalRoles(roles)));
  }

  /**
   * Fetches all users with their roles.
   */
  getAllUsers(): Observable<UserAccount[]> {
    return this.findUsersBy({}).pipe(
      switchMap((users) => {
        if (users.length === 0) {
          return of([]);
        }

        // For each user, fetch their roles with individual error handling
        const usersWithRoles$ = users.map((user) =>
          this.getRolesOfUser(user.id).pipe(
            map((roles) => ({
              id: user.id,
              email: user.email,
              userEntityId: user.attributes?.exact_username?.[0],
              enabled: user.enabled,
              emailVerified: user.emailVerified,
              roles,
            })),
            catchError((error) => {
              // Log the error but don't fail the entire operation
              Logging.warn(`Failed to fetch roles for user ${user.id}`, error);
              // Return user without roles
              return of({
                id: user.id,
                email: user.email,
                userEntityId: user.attributes?.exact_username?.[0],
                enabled: user.enabled,
                emailVerified: user.emailVerified,
                roles: [],
              } as UserAccount);
            }),
          ),
        );

        return forkJoin(usersWithRoles$);
      }),
    );
  }

  private filterNonTechnicalRoles(roles: Role[]) {
    return roles.filter(
      (role) =>
        !KeycloakAdminService.KEYCLOAK_DEFAULT_ROLES.includes(role.name),
    );
  }

  getRolesOfUser(userAccountId: string) {
    return this.http
      .get<
        Role[]
      >(`${this.keycloakUrl}/users/${userAccountId}/role-mappings/realm`)
      .pipe(map((roles) => this.filterNonTechnicalRoles(roles)));
  }

  /**
   * Assigns a list of roles to a user.
   * @param userAccountId
   * @param roles should be objects equal to the ones provided by `getRoles()`
   */
  assignRoles(userAccountId: string, roles: any[]) {
    const appRoles = this.filterNonTechnicalRoles(roles);
    return this.http.post(
      `${this.keycloakUrl}/users/${userAccountId}/role-mappings/realm`,
      appRoles,
    );
  }

  /**
   * Delete a list of roles from a user.
   * @param userAccountId
   * @param roles should be objects equal to the ones provided by `getRoles()`
   */
  deleteRoles(userAccountId: string, roles: any[]) {
    const appRoles = this.filterNonTechnicalRoles(roles);
    return this.http.delete(
      `${this.keycloakUrl}/users/${userAccountId}/role-mappings/realm`,
      { body: appRoles },
    );
  }

  /**
   * Map common API errors to well-defined UserAdminApiErrors
   * @param originalError
   * @private
   */
  private transformStandardError(originalError: any) {
    if (
      originalError?.name === "HttpErrorResponse" &&
      originalError?.status === 0
    ) {
      return new UserAdminApiError(
        500,
        $localize`:User API error:Could not connect to the server. Please check your network connection, try again later or reach out to your technical support team.`,
      );
    }

    return originalError;
  }
}
