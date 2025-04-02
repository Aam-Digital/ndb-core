import { UserAccount } from "./user-account";

/**
 * Extract of Keycloak user object as provided by the external Keycloak Service.
 * See {@link https://www.keycloak.org/docs-api/19.0.3/rest-api/index.html#_userrepresentation}
 *
 * These fields overlap with our internal `SessionInfo` interface that is seen as abstracted from Keycloak.
 */
export class KeycloakUserDto {
  id?: string;

  username?: string;

  email?: string;

  attributes?: { [key in string]: string };

  requiredActions?: string[];

  enabled? = true;

  emailVerified?: boolean;

  constructor(email?: string, userEntityId?: string) {
    if (email) {
      this.username = email; // previously we have set the userEntityId here but this doesn't really make sense and newer Keycloak version don't allow some of the characters
      this.email = email;
      this.emailVerified = false;
      this.requiredActions = ["VERIFY_EMAIL", "UPDATE_PASSWORD"];
    }
    if (userEntityId) {
      this.attributes = { exact_username: userEntityId };
    }
  }

  static fromUserAccount(userAccount: Partial<UserAccount>): KeycloakUserDto {
    const kcUser = new KeycloakUserDto();
    kcUser.id = userAccount.id;
    kcUser.email = userAccount.email;
    kcUser.enabled = userAccount.enabled;
    kcUser.emailVerified = userAccount.emailVerified;
    if (userAccount.userEntityId) {
      kcUser.attributes = kcUser.attributes ?? {};
      kcUser.attributes.exact_username = userAccount.userEntityId;
    }
    return kcUser;
  }
}
