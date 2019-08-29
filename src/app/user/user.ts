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

import { Entity } from '../entity/entity';
import {DatabaseEntity} from '../entity/database-entity.decorator';
import {DatabaseField} from '../entity/database-field.decorator';

declare const require: any;
const CryptoJS = require('crypto-js');

@DatabaseEntity('User')
export class User extends Entity {
  @DatabaseField() name: string;
  @DatabaseField() admin: boolean;

  @DatabaseField()
  private password: any;
  //
  @DatabaseField()
  private blobPasswordEnc: any;
  // nextCloud password that gets encrypted during session
  public blobPasswordDec: any;

  // TODO: nextCloud password change for admin
  public setNewPassword(password: string) {
    const cryptKeySize = 256 / 32;
    const cryptIterations = 128;
    const cryptSalt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const hash = CryptoJS.PBKDF2(password, cryptSalt, {
      keySize: cryptKeySize,
      iterations: cryptIterations
    }).toString();

    this.password = {'hash': hash, 'salt': cryptSalt, 'iterations': cryptIterations, 'keysize': cryptKeySize};

    // update encrypted nextcloud password
    this.blobPasswordEnc = CryptoJS.AES.encrypt(this.blobPasswordDec, password).toString();
  }

  public checkPassword(givenPassword: string): boolean {
    // compares given password to the stored one of this user
    // therefore hashes the given password string and compares it with the sored hash
    if  (this.hashPassword(givenPassword) === this.password.hash) {
      this.decryptBlobPassword(givenPassword);
    }
    return (this.hashPassword(givenPassword) === this.password.hash);
  }

  private hashPassword(givenPassword: string): string {
    const options = {
      keySize: this.password.keysize,
      iterations: this.password.iterations
    };
    return CryptoJS.PBKDF2(givenPassword, this.password.salt, options).toString();
  }

  private decryptBlobPassword(givenPassword: string){
    this.blobPasswordDec = CryptoJS.AES.decrypt(this.blobPasswordEnc.toString(), givenPassword).toString(CryptoJS.enc.Utf8);
  }

  public setBlobPassword(blobPassword: string, givenPassword: string) {
    if (this.checkPassword(givenPassword)) {
      this.blobPasswordEnc = CryptoJS.AES.encrypt(blobPassword, givenPassword).toString();
    }
  }

  public isAdmin(): boolean {
    return this.admin;
  }
}
