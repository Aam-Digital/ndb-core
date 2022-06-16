import { Injectable } from "@angular/core";
import { createClient, WebDAVClient, WebDAVClientOptions } from "webdav/web";

/**
 * This Class only wraps the webdav library module in order for it to be mock-able in tests
 */
@Injectable({
  providedIn: "root",
})
export class WebdavWrapperService {
  public createClient(
    remoteUrl: string,
    options?: WebDAVClientOptions
  ): WebDAVClient {
    return createClient(remoteUrl, options);
  }
}
