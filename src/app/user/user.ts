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
    var cryptKeySize = 256 / 32;
    var cryptIterations = 128;
    var cryptSalt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    var hash = CryptoJS.PBKDF2(password, cryptSalt, {
      keySize: cryptKeySize,
      iterations: cryptIterations
    }).toString();

    this.password = {'hash': hash, 'salt': cryptSalt, 'iterations': cryptIterations, 'keysize': cryptKeySize};
  }

  public checkPassword(givenPassword: string): boolean {
    return (this.hashPassword(givenPassword) === this.password.hash);
  }

  private hashPassword(givenPassword: string): string {
    let options = {
      keySize: this.password.keysize,
      iterations: this.password.iterations
    };

    return CryptoJS.PBKDF2(givenPassword, this.password.salt, options).toString();
  }
}
