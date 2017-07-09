import { Injectable } from '@angular/core';
import { Entity } from '../entity/entity';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
declare const require: any;
const CryptoJS = require('crypto-js');
@Injectable()
export class ChangePasswordService {

  public name: string;
  public lastUsedVersion: string;
  private password: any;

  constructor() { }

  public getPrefix(): string {
    return 'user:';
  }

  public setNewPassword(password) {
    const cryptKeySize = 256 / 32;
    const cryptIterations = 128;
    const cryptSalt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const hash = CryptoJS.PBKDF2(password, cryptSalt, {
      keySize: cryptKeySize,
      iterations: cryptIterations
    }).toString();
    console.log('a');
    this.password = {'hash': hash, 'salt': cryptSalt, 'iterations': cryptIterations, 'keysize': cryptKeySize};
  }
}
