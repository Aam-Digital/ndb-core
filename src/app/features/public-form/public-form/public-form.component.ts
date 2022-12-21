import { Component } from "@angular/core";
import { Child } from "../../../child-dev-project/children/model/child";
import { AppSettings } from "../../../core/app-config/app-settings";
import { PouchDatabase } from "../../../core/database/pouch-database";
import PouchDB from "pouchdb-browser";

@Component({
  selector: "app-public-form",
  templateUrl: "./public-form.component.html",
  styleUrls: ["./public-form.component.scss"],
})
export class PublicFormComponent {
  entity = new Child();
  columns = [
    ["name"],
    ["projectNumber"],
    ["gender"],
    ["center"],
    ["dateOfBirth"],
  ];

  constructor(private database: PouchDatabase) {
    // TODO the component should probably not handle this and it is very similar to the RemoteSession
    this.database.initIndexedDB(
      `${AppSettings.DB_PROXY_PREFIX}/${AppSettings.DB_NAME}`,
      {
        adapter: "http",
        skip_setup: true,
        fetch: (url, opts: any) => {
          if (typeof url === "string") {
            const remoteUrl =
              AppSettings.DB_PROXY_PREFIX +
              url.split(AppSettings.DB_PROXY_PREFIX)[1];
            return PouchDB.fetch(remoteUrl, opts);
          }
        },
      }
    );
  }
}
