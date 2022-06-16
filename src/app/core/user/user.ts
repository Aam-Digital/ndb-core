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

  /**
   * settings for the mat-paginator for tables.
   * map of ids (uniquely identifying a table) to pageSize or pageIndex.
   *
   * pageSizeOptions is set in the corresponding html of the component,
   * pageSize is stored persistently in the database and
   * pageIndex is saved only temporarily for the session
   */
  @DatabaseField() paginatorSettingsPageSize: { [id: string]: number } = {};
  public paginatorSettingsPageIndex: { [id: string]: number } = {};

  /** password for webdav account (encrypted) */
  @DatabaseField() private cloudPasswordEnc: any;

  /** username for webdav account */
  @DatabaseField() public cloudUserName: string;

  /** password for webdav account (plaintext, decrypted during runtime from user.cloudPasswordEnc, not written to db) */
  public cloudPasswordDec: any;

  /** base folder for webdav, all actions of the app will happen relative to this as the root folder */
  @DatabaseField() public cloudBaseFolder: string = "/aam-digital/";

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
    this.cloudPasswordDec = blobPassword;
    this.cloudPasswordEnc = CryptoES.AES.encrypt(
      blobPassword,
      givenPassword
    ).toString();
  }

  toString(): string {
    return this.name;
  }
}
