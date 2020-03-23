import { Injectable } from '@angular/core';
import { AppConfig } from '../app-config/app-config';
import webdav from 'webdav';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SessionService } from '../session/session.service';
/**
 * This class provides access to the in config.json specified cloud service.
 */
@Injectable()
export class CloudFileService {

  // TODO Check connection/login success?
  private client: any;
  private imagePath: string;
  // private defaultImage: SafeUrl;
  private fileList: string;
  private currentlyGettingList: Promise<boolean>;

  constructor(
    private domSanitizer: DomSanitizer,
    private sessionService: SessionService,
  ) {
      this.connect();
  }

  /**
   * Reinitialize the client for the nextcloud server
   * @param username
   * @param password login password
   */
  public async connect(username: string = null, password: string = null) {
    if (!AppConfig.settings.webdav || !this.sessionService.getCurrentUser()) {
      return;
    }

    this.reset();

    const currentUser = this.sessionService.getCurrentUser();
    this.imagePath = currentUser.imagePath;

    if (username === null && password == null) {
      username = currentUser.cloudUserName;
      password = currentUser.cloudPasswordDec;
    }

    if (!username || !password) {
      // abort if account is not configured
      this.client = null;
      return;
    }

    this.client = await webdav.createClient(
      AppConfig.settings.webdav.remote_url,
      {
        username: username,
        password: password,
      },
    );
  }

  /**
   * Reset the current state and requests.
   * e.g. clear promise that retrieves the root dir
   */
  private reset() {
    this.currentlyGettingList = null;
    this.fileList = null;
  }

  /**
   * checkConnection
   *
   * tries to upload and redownload a file.
   */
  public async checkConnection(): Promise<boolean> {
    // delete 'tmp.txt' if it exists
    const fileName: string = '/test.txt';
    if (await this.doesFileExist(fileName)) {
      await this.client.deleteFile(fileName);
    }

    await this.client.putFileContents(fileName, 'TestString');
    const buffer = await this.client.getFileContents(fileName);
    const tmpContent = String.fromCharCode.apply(null, new Uint8Array(buffer));
    await this.client.deleteFile(fileName);

    if (tmpContent === 'TestString') {
      console.log('Connection to cloud service successful.');
      return true;
    }
    console.log('Can not connect to cloud service.');
    return false;
  }

  /**
   * Returns the content path
   * @param path example '/'
   */
  public async getDir(path: string): Promise<string> {
    const contents = await this.client.getDirectoryContents(path);
    return JSON.stringify(contents, undefined, 4);
  }

  /**
   * Checks if the file exists in the root directory.
   * @param name file name to check
   */
  public async doesFileExist(name: string): Promise<boolean> {
    if (!this.fileList && !this.currentlyGettingList) {
      // create promise that resolves when the file list is loaded
      // if this function gets called mulitple times this ensures that the list will only be loaded once
      this.currentlyGettingList = new Promise(resolve => {
        this.getDir(this.imagePath).then(list => {
          this.fileList = list;
          resolve(true);
        });
      });
    }
    if (!this.fileList) {
      await this.currentlyGettingList;
    }
    // hacky way of checking if file exists, subject to change
    // TODO fix this
    if (this.fileList.includes('"basename": "' + name.split('/').pop() + '"')) {
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
   * @param childId Id of child for which one wants to store the image
   */
  public async setImage(imageFile: any, childId: string) {
    this.client.putFileContents(this.imagePath + '/' + childId, imageFile,
      {onUploadProgress: progress => {
      console.log(`Uploaded ${progress.loaded} bytes of ${progress.total}`);
      }},
    );
  }

  /**
   * Returns a Promise which resolves as an ArrayBuffer of the file located at the given path
   * @param childId
   */
  public async getImage(childId: string): Promise<SafeUrl> {
    const imageType = [ '' , '.jpg', '.jpeg', '.png' ];

    for (const ext of imageType) {
      if (await this.doesFileExist(childId + ext)) {
        const image = await this.client.getFileContents(this.imagePath + '/' + childId + ext);
        return this.bufferArrayToBase64(image);
      }
    }
    return await this.getDefaultImage();
  }

  /**
   * Returns a Promise which resolves as an ArrayBuffer of the default child image
   */
  public getDefaultImage(): SafeUrl {
    // if (!this.defaultImage) {
    //  const image = this.client.getFileContents('default.png');
    //  this.defaultImage = this.bufferArrayToBase64(image);
    // }
    // return new Promise( (resolve, reject) => resolve(this.defaultImage));
    return 'assets/child.png';
  }

  /**
   * converts an ArrayBuffer to a SafeUrl and returns it
   * @param arrayBuffer ArrayBuffer to be converted
   */
  private bufferArrayToBase64(arrayBuffer: ArrayBuffer): SafeUrl {
    const base64String = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => {
        return data + String.fromCharCode(byte); }, ''),
      );
    return this.domSanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,' + base64String);
  }
}
