import { Injectable } from '@angular/core';
import { AppConfig } from '../app-config/app-config';
import webdav from 'webdav';

@Injectable({
  providedIn: 'root'
})
export class BlobServiceService {

  private client:any;
  constructor() { 
    //const { createClient } = require("webdav");

    this.client = webdav.createClient(
      AppConfig.settings.webdav.remote_url,
      {
        username:AppConfig.settings.webdav.username,
        password:AppConfig.settings.webdav.password
      }
    )
  };

  public async getDir() {
    try {
      const contents = await this.client.getDirectoryContents("");
      console.log(JSON.stringify(contents, undefined, 4));
    } catch (error) {
      console.log(error)
    }
  }

  public getFile(id: string):any {
    return this.client.getFileContents("/"+id)
  }

  public setFile(file: any, path:string) {
    this.client.putFileContents(path, file);
  }
}
