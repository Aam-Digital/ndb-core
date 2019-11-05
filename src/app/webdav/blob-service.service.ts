import { Injectable } from '@angular/core';
import { AppConfig } from '../app-config/app-config';
import webdav from 'webdav';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SessionService } from 'app/session/session.service';

@Injectable()
export class BlobService {

  private client: any;
  private fileList: string;

  constructor(private domSanitizer: DomSanitizer,
    private sessionService: SessionService) {
    // const { createClient } = require("webdav");

    if (this.sessionService.getCurrentUser() != null) {
      this.client = webdav.createClient(
        AppConfig.settings.webdav.remote_url,
        {
          username: 'nextclouduser',
          password: this.sessionService.getCurrentUser().blobPasswordDec
        }
      );
    }
  }

  /**
   * Returns the content of '/' + path
   * @param path path without leading '/'
   */
  public async getDir(path: string): Promise<any> {
      const contents = await this.client.getDirectoryContents(path);
    return JSON.stringify(contents, undefined, 4);
  }

  public async doesFileExist(name: string): Promise<Boolean> {
    if (!this.fileList) {
      this.fileList = await this.getDir('');
    }
    // hacky way of checking if file exists, subject to change
    // TODO fix this
    if (this.fileList.includes('"basename": "' + name + '"')) {
      return true;
    }
    return false;
  }

  /**
  * creates new directory
  * @param path path to directory to be created
  */
  public async createDir(path: string) {
    this.client.createDirectory(path);
  }

  /**
   * Uploads a given image to the nextcloud server.
   * @param imageFile Image to be stored
   * @param path path where the image will be stored
   */
  public async setImage(imageFile: any, path: string) {
    this.client.putFileContents(path, imageFile,
      {onUploadProgress: progress => {
      console.log(`Uploaded ${progress.loaded} bytes of ${progress.total}`);
      }}
    );
  }

  /**
   * Returns a Promise which resolves as an ArrayBuffer of the file located at the given path
   * @param path
   */
  public async getImage(path: string): Promise<ArrayBuffer> {
    if (await this.doesFileExist(path)) {
    return this.client.getFileContents(path); //.then(arr => {return this._bufferArrayToBase64(arr); } );
  }
    return new ArrayBuffer(0);
  }

  /**
   * Returns a Promise which resolves as an ArrayBuffer of the default child image
   */
  public async getDefaultImage(): Promise<ArrayBuffer> {
    return this.client.getFileContents('default.png');
  }

  /**
   * converts an ArrayBuffer to a SafeUrl and returns it
   * @param arrayBuffer ArrayBuffer to be converted
   */
  public _bufferArrayToBase64(arrayBuffer: ArrayBuffer): SafeUrl {
    const base64String = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => {
        return data + String.fromCharCode(byte); }, '')
      );
    return this.domSanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,' + base64String);
  }
}
