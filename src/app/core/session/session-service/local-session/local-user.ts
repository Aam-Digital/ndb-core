export interface LocalUser {
  name: string;
  roles: string[];
  hash: string;
  salt: string;
  iterations: number;
  keysize: number;
}
