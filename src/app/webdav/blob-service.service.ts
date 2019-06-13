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
}
