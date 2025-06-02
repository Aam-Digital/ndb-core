import { inject, Injectable } from "@angular/core";
import { BaseConfig } from "./base-config";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { HttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import { DemoDataInitializerService } from "../demo-data/demo-data-initializer.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { Entity } from "../entity/model/entity";
import { Logging } from "../logging/logging.service";
import { MatDialog } from "@angular/material/dialog";
import { DemoAssistanceDialogComponent } from "./demo-assistance-dialog/demo-assistance-dialog.component";
import { LoginState } from "../session/session-states/login-state.enum";
import { LoginStateSubject } from "../session/session-type";
import { map } from "rxjs/operators";
import { ContextAwareDialogComponent } from "./context-aware-dialog/context-aware-dialog.component";

/**
 * Loads available "scenarios" of base configs
 * that users can select to start with setting up their system.
 */
@Injectable({
  providedIn: "root",
})
export class SetupService {
  private readonly httpClient = inject(HttpClient);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly schemaService = inject(EntitySchemaService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly demoDataInitializer = inject(DemoDataInitializerService);
  private readonly dialog = inject(MatDialog);
  private readonly loginState = inject(LoginStateSubject);

  /**
   * Bridge to old DemoDataModule flow of generating demo data.
   * TODO: remove or refactor to match with new assets configs.
   * @deprecated will be replaced by calls to initSystemWithBaseConfig()
   * @private
   */
  async initDemoData(baseConfig: BaseConfig): Promise<void> {
    // todo: remove this method once the new base config system is fully implemented
    // This is to prevent re-initialization if the user is already logged in.
    const isLoggedIn = this.loginState.value === LoginState.LOGGED_IN;
    if (isLoggedIn) {
      return;
    }
    // log in as demo user to initialize the database
    await this.demoDataInitializer.logInDemoUser();

    await this.initSystemWithBaseConfig(baseConfig);

    if (environment.demo_mode) {
      await this.demoDataInitializer.generateDemoData();
    }
  }

  async getAvailableBaseConfig(): Promise<BaseConfig[]> {
    // TODO: implement dynamic loading of base configs from assets/base-configs/

    return [
      {
        id: "basic",
        name: "Basic Setup",
        description:
          "A basic setup with minimal configuration to get started quickly.",
        entitiesToImport: ["Config_CONFIG_ENTITY.json"],
      },
      {
        id: "education",
        name: "Education Project",
        description: "School or after-school example.",
        entitiesToImport: ["Config_CONFIG_ENTITY.json"],
      },
    ];
  }

  async initSystemWithBaseConfig(baseConfig: BaseConfig): Promise<void> {
    const folder = `assets/base-configs/${baseConfig.id}/`;
    for (const file of baseConfig.entitiesToImport) {
      const entity = await this.loadEntityFromFile(folder + file);
      await this.entityMapper.save(entity);
    }
  }

  /**
   * (Try to) load the given file and convert it to an Entity instance
   * to be saved to the database.
   * @param filePath
   * @private
   */
  private async loadEntityFromFile(
    filePath: string,
  ): Promise<Entity | undefined> {
    const doc = await lastValueFrom(
      this.httpClient
        .get(filePath, { responseType: "json" })
        .pipe(map((data) => this.localizeJson(data))),
    );

    // extract ##i18n## tags from all string values in the loaded JSON
    // This is necessary to ensure that the i18n tags are not stored in the database.
    // todo: this is a temporary solution, as the i18n tags should be handled by the i18n service.
    // This will be removed once we found a package that supports i18n tags in JSON files.(for example, ngx-translate)
    this.extractI18nTags(doc);

    if (!doc || !doc["_id"]) {
      Logging.warn(
        "Invalid entity file. SetupService is skipping to import this.",
        filePath,
        doc,
      );
      return;
    }

    const entityType = this.entityRegistry.get(
      Entity.extractTypeFromId(doc["_id"]),
    );
    if (!entityType) {
      throw new Error("EntityType for entityToImport not found: " + doc["_id"]);
    }

    const entity = this.schemaService.loadDataIntoEntity(new entityType(), doc);
    Logging.debug("Importing baseConfig entity", entity);
    return entity;
  }

  /**
   * Remove ##i18n## tags from all string values in an object.
   */
  private extractI18nTags(obj: any): any {
    if (typeof obj === "string") {
      if (obj.startsWith("##i18n##:")) {
        // Remove everything up to and including the last colon
        return obj.replace(/^##i18n##:.*:/, "");
      }
      if (obj.startsWith("##i18n##")) {
        return obj.replace(/^##i18n##/, "");
      }
      return obj;
    } else if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = this.extractI18nTags(obj[i]);
      }
    } else if (typeof obj === "object" && obj !== null) {
      for (const key of Object.keys(obj)) {
        obj[key] = this.extractI18nTags(obj[key]);
      }
    }
    return obj;
  }

  /**
   * Opens a dialog to assist the user in setting up a demo environment.
   * Depending on the user's login state, it opens either a context-aware dialog (if logged in)
   * or a demo assistance dialog (if not logged in). The dialog guides the user through selecting
   * a use case and initializing the system with the corresponding demo data.
   * @returns A promise that resolves with the dialog result when the dialog is closed.
   */
  public async openDemoSetupDialog() {
    const isLoggedIn = this.loginState.value === LoginState.LOGGED_IN;
    const commonOptions = {
      autoFocus: false,
      height: "calc(100% - 20px)",
      maxWidth: "100%",
      maxHeight: "100%",
      position: { top: "64px", right: "0px" },
    };
    let dialogRef;
    if (isLoggedIn) {
      dialogRef = this.dialog.open(ContextAwareDialogComponent, {
        ...commonOptions,
        width: "40vh",
        disableClose: false,
        hasBackdrop: true,
      });
    } else {
      dialogRef = this.dialog.open(DemoAssistanceDialogComponent, {
        ...commonOptions,
        width: "calc(100% - 100px)",
        disableClose: true,
        hasBackdrop: false,
      });
    }
    return await lastValueFrom(dialogRef.afterClosed());
  }

  private localizeJson(jsonText) {
    // TODO: work in progress. Replacing i18n markers with this doesn't work yet ...

    // 1. Full format: ##i18##:meaning|description@@id:Text
    // 2. Simple format: ##i18##Text
    const localizedJson = JSON.stringify(jsonText).replace(
      /##i18##(?::([^:]*?)@@([^:]*?):)?(.+)/g,
      (match, meaning, id, text) => {
        if (meaning && id) {
          // Full format with metadata
          return $localize`:${meaning}@@${id}:${text}`;
        } else {
          // Simple format without metadata
          return $localize`${text}`;
        }
      },
    );
    return JSON.parse(localizedJson);
  }
}
