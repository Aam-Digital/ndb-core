import { Injectable } from '@angular/core';
import { AppConfig } from '../app-config/app-config';
import webdav from 'webdav';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class BlobServiceService {

  private client: any;
  constructor(private domSanitizer: DomSanitizer) {
    // const { createClient } = require("webdav");

    this.client = webdav.createClient(
      AppConfig.settings.webdav.remote_url,
      {
        username: AppConfig.settings.webdav.username,
        password: AppConfig.settings.webdav.password
      }
    );
  }

  public async getDir() {
    try {
      const contents = await this.client.getDirectoryContents('');
      console.log(JSON.stringify(contents, undefined, 4));
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Uploads a given image to the nextcloud server.
   * @param imageFile Image to be stored
   * @param path path where the image will be stored
   */
  public async setImage(imageFile: any, path: string) {
    await this.client.putFileContents(path, imageFile,
      {onUploadProgress: progress => {
      console.log(`Uploaded ${progress.loaded} bytes of ${progress.total}`);
      }}
    );
  }

  public async getImage(path: string): Promise<any> {
    return this.client.getFileContents(path);
  }

  /**
   * returns a download link for an image
   * @param path path of the image on server
   */
  public bufferArrayToBase64(arrayBuffer: ArrayBuffer): SafeUrl{
    const TYPED_ARRAY = new Uint8Array(arrayBuffer);
    const STRING_CHAR = String.fromCharCode.apply(null, TYPED_ARRAY);
    const base64String = btoa(STRING_CHAR);
    return this.domSanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,' + base64String);
  }
}
