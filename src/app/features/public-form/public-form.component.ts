import { Component } from "@angular/core";
import { AppSettings } from "../../core/app-config/app-settings";
import { PouchDatabase } from "../../core/database/pouch-database";
import PouchDB from "pouchdb-browser";
import { ActivatedRoute } from "@angular/router";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { PublicFormConfig } from "./public-form-config";
import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import { toFormFieldConfig } from "../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FormFieldConfig } from "../../core/entity-components/entity-form/entity-form/FormConfig";
import {
  EntityForm,
  EntityFormService,
} from "../../core/entity-components/entity-form/entity-form.service";
import { EntityFormComponent } from "../../core/entity-components/entity-form/entity-form/entity-form.component";
import { MatButtonModule } from "@angular/material/button";
import { ConfigService } from "../../core/config/config.service";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";

@Component({
  selector: "app-public-form",
  templateUrl: "./public-form.component.html",
  styleUrls: ["./public-form.component.scss"],
  imports: [EntityFormComponent, MatButtonModule],
  standalone: true,
})
export class PublicFormComponent {
  private entityType: EntityConstructor;
  private prefilled: any = {};
  entity: Entity;
  columns: FormFieldConfig[][];
  form: EntityForm<Entity>;
  title = "Form";

  constructor(
    private database: PouchDatabase,
    private route: ActivatedRoute,
    private entities: EntityRegistry,
    private entityMapper: EntityMapperService,
    private entityFormService: EntityFormService,
    private configService: ConfigService,
    private entitySchemaService: EntitySchemaService
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
    // wait for config to be initialized
    this.configService.configUpdates.subscribe(() => this.loadFormConfig());
  }

  submit() {
    this.entityFormService
      .saveChanges(this.form, this.entity)
      .then(() => this.initForm());
  }

  reset() {
    this.initForm();
  }

  private async loadFormConfig() {
    const id = this.route.snapshot.paramMap.get("id");
    const config = await this.entityMapper.load(PublicFormConfig, id);
    this.entityType = this.entities.get(config.entity);
    if (config.prefilled) {
      this.prefilled = this.entitySchemaService.transformDatabaseToEntityFormat(
        config.prefilled,
        this.entityType.schema
      );
    }
    this.columns = config.columns.map((row) => row.map(toFormFieldConfig));
    this.title = config.title ?? this.title;
    this.initForm();
  }

  private initForm() {
    this.entity = new this.entityType();
    Object.entries(this.prefilled).forEach(([prop, value]) => {
      this.entity[prop] = value;
    });
    this.form = this.entityFormService.createFormGroup(
      [].concat(...this.columns),
      this.entity
    );
  }
}
