import { Injectable } from '@angular/core';
import { AppConfig } from '../app-config/app-config';
import webdav from 'webdav';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SessionService } from 'app/session/session.service';

@Injectable()
export class BlobService {

  private client: any;
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
  public async getDir(path: string) {
    try {
      const contents = await this.client.getDirectoryContents(path);
      console.log(JSON.stringify(contents, undefined, 4));
    } catch (error) {
      console.log(error);
    }
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
    return this.client.getFileContents(path);
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
  public bufferArrayToBase64(arrayBuffer: ArrayBuffer): SafeUrl {
    const base64String = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => {
        return data + String.fromCharCode(byte); }, '')
      );
    return this.domSanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,' + base64String);
  }
}
