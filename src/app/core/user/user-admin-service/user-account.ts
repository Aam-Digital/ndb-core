/**
 * User Account from external Authentication provider like Keycloak.
 */
export interface UserAccount {
  id: string;

  email?: string;

  userEntityId?: string;

  enabled: boolean;

  emailVerified?: boolean;

  roles?: Role[];
}

/**
 * User Role object.
 * also see {@link https://www.keycloak.org/docs-api/19.0.3/rest-api/index.html#_rolerepresentation}
 */
export interface Role {
  id: string;
  name: string;
  description: string;
}
