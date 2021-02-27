import { Injectable } from "@angular/core";
import webdav, { WebDAVClientOptions } from "webdav";

@Injectable({
  providedIn: "root",
})
/**
 * This Class only wraps the webdav library module in order for it to be mock-able in tests
 */
export class WebdavWrapperService {
  public createClient(remoteUrl: string, options?: WebDAVClientOptions) {
    webdav.createClient(remoteUrl, options);
  }
}
