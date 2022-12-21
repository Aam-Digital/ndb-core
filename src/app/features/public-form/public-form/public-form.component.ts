import { Component } from "@angular/core";
import { AppSettings } from "../../../core/app-config/app-settings";
import { PouchDatabase } from "../../../core/database/pouch-database";
import PouchDB from "pouchdb-browser";
import { ActivatedRoute } from "@angular/router";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { PublicFormConfig } from "../public-form-config";
import { Entity } from "../../../core/entity/model/entity";
import { ColumnConfig } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";

@Component({
  selector: "app-public-form",
  templateUrl: "./public-form.component.html",
  styleUrls: ["./public-form.component.scss"],
})
export class PublicFormComponent {
  entity: Entity;
  columns: ColumnConfig[][];

  constructor(
    private database: PouchDatabase,
    private route: ActivatedRoute,
    private entities: EntityRegistry,
    private entityMapper: EntityMapperService
  ) {
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
    this.loadFormConfig();
  }

  private async loadFormConfig() {
    // const id = this.route.snapshot.paramMap.get("id");
    // const config = await this.entityMapper.load(PublicFormConfig, id);
    const config = this.getDefaultConfig();
    const entityType = this.entities.get(config.entity);
    this.entity = new entityType();
    Object.entries(config.prefilled).forEach(([prop, value]) => {
      // TODO parse ConfigurableEnums, dates etc. (entity format)
      this.entity[prop] = value;
    });
    this.columns = config.columns;
  }

  private getDefaultConfig() {
    const formConfig = new PublicFormConfig();
    formConfig.entity = "Child";
    formConfig.columns = [
      ["name"],
      ["projectNumber"],
      ["gender"],
      ["center"],
      ["dateOfBirth"],
    ];
    formConfig.prefilled = { status: "new" };
    return formConfig;
  }
}
