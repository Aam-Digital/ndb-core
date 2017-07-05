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
import * as CryptoJS from 'crypto-js';


export class User extends Entity {

  public name: string;
  public lastUsedVersion: string;
  private password: any;

  public getPrefix(): string {
    return 'user:';
  }

  public setNewPassword(password: string) {
    const cryptKeySize = 256 / 32;
    const cryptIterations = 128;

    //noinspection TypeScriptUnresolvedVariable (out-of-date types for crypto-js, lib is a valid field)
    const cryptSalt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const hash = CryptoJS.PBKDF2(password, cryptSalt, {
      keySize: cryptKeySize,
      iterations: cryptIterations
    }).toString();

    this.password = {'hash': hash, 'salt': cryptSalt, 'iterations': cryptIterations, 'keysize': cryptKeySize};
  }

  public checkPassword(givenPassword: string): boolean {
    return (this.hashPassword(givenPassword) === this.password.hash);
  }

  private hashPassword(givenPassword: string): string {
    const options = {
      keySize: this.password.keysize,
      iterations: this.password.iterations
    };

    return CryptoJS.PBKDF2(givenPassword, this.password.salt, options).toString();
  }
}
