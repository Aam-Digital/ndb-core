/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Entity } from "../entity/model/entity";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";
import CryptoES from "crypto-es";

/**
 * Entity representing a User object including password.
 *
 * Note that in addition to the User Entity there also is a "regular" CouchDB user with the same name and password
 * in the CouchDB _users database which is used for remote database authentication.
 */
@DatabaseEntity("User")
export class User extends Entity {
  /** username used for login and identification */
  @DatabaseField() name: string;

  /** whether this user has admin rights */
  @DatabaseField() admin: boolean;

  /** password object (encrypted) */
  @DatabaseField() private password: any;

  /** settings for the mat-paginator for tables
   * pageSizeOptions is set in the corresponding html of the component,
   * pageSize is stored persistently in the database and
   * pageIndex is saved only temporarily for the session
   */
  @DatabaseField() paginatorSettingsPageSize: any = {};
  public paginatorSettingsPageIndex: any = {};

  /** password for webdav account (encrypted with user.password) */
  @DatabaseField() private cloudPasswordEnc: any;

  /** username for webdav account */
  @DatabaseField() public cloudUserName: string;

  /** password for webdav account (plaintext, decrypted during runtime from user.cloudPasswordEnc, not written to db) */
  public cloudPasswordDec: any;

  /** base folder for webdav, all actions of the app will happen relative to this as the root folder */
  @DatabaseField() public cloudBaseFolder: string = "/aam-digital/";

  /**
   * Set a new user password.
   * This will be encrypted before saving.
   *
   * Warning: User password must be identical to the CouchDB user password. Otherwise database sync will fail!
   *
   * @param password The new password to be set
   */
  public setNewPassword(password: string) {
    const cryptKeySize = 256 / 32;
    const cryptIterations = 128;
    const cryptSalt = CryptoES.lib.WordArray.random(128 / 8).toString();
    const hash = CryptoES.PBKDF2(password, cryptSalt, {
      keySize: cryptKeySize,
      iterations: cryptIterations,
    }).toString();

    this.password = {
      hash: hash,
      salt: cryptSalt,
      iterations: cryptIterations,
      keysize: cryptKeySize,
    };

    // update encrypted nextcloud password
    this.cloudPasswordEnc = CryptoES.AES.encrypt(
      this.cloudPasswordDec,
      password
    ).toString();
  }

  /**
   * Check whether the given password is correct.
   * @param givenPassword Password attempted
   */
  public checkPassword(givenPassword: string): boolean {
    // hash the given password string and compare it with the stored hash
    return this.hashPassword(givenPassword) === this.password.hash;
  }

  /**
   * Decrypt the stored cloud password with the user's regular password.
   * @param givenPassword The user entity's password (not the webdav cloud password)
   * @return the decrypted cloud password
   */
  public decryptCloudPassword(givenPassword: string): string {
    if (!this.cloudPasswordEnc) {
      return;
    }

    this.cloudPasswordDec = CryptoES.AES.decrypt(
      this.cloudPasswordEnc.toString(),
      givenPassword
    ).toString(CryptoES.enc.Utf8);
    return this.cloudPasswordDec;
  }

  /**
   * Set a new webdav cloud password.
   * @param blobPassword The password for the cloud account.
   * @param givenPassword The user entity's password (used for encrypting the cloud password before storage)
   */
  public setCloudPassword(blobPassword: string, givenPassword: string) {
    if (this.checkPassword(givenPassword)) {
      this.cloudPasswordDec = blobPassword;
      this.cloudPasswordEnc = CryptoES.AES.encrypt(
        blobPassword,
        givenPassword
      ).toString();
    }
  }

  private hashPassword(givenPassword: string): string {
    const options = {
      keySize: this.password.keysize,
      iterations: this.password.iterations,
    };
    return CryptoES.PBKDF2(
      givenPassword,
      this.password.salt,
      options
    ).toString();
  }

  /**
   * Check admin rights of the user.
   */
  public isAdmin(): boolean {
    return this.admin || false;
  }

  /**
   * Change this user's admin status
   * @param admin New admin status to be set
   */
  public setAdmin(admin: boolean) {
    this.admin = admin;
  }

  toString(): string {
    return this.name;
  }
}
