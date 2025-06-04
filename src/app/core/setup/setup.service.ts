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
import { LoginState } from "../session/session-states/login-state.enum";
import { LoginStateSubject } from "../session/session-type";
import { ContextAwareDialogComponent } from "./context-aware-dialog/context-aware-dialog.component";
import { asArray } from "../../utils/asArray";

/**
 * Loads available "scenarios" of base configs
 * that users can select to start with setting up their system.
 */
@Injectable({
  providedIn: "root",
})
export class SetupService {
  private readonly BASE_CONFIGS_FOLDER = "assets/base-configs/";

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
    const doc = await lastValueFrom(
      this.httpClient.get<BaseConfig[]>(
        this.BASE_CONFIGS_FOLDER + "/available-configs.json",
        { responseType: "json" },
      ),
    );

    return doc;
  }

  async initSystemWithBaseConfig(baseConfig: BaseConfig): Promise<void> {
    for (const file of baseConfig.entitiesToImport) {
      const fileName = `${this.BASE_CONFIGS_FOLDER}/${file}`;

      const docs = asArray(
        await lastValueFrom(
          this.httpClient.get<Object | Object[]>(fileName, {
            responseType: "json",
          }),
        ),
      );

      for (const doc of docs) {
        const entity = this.parseObjectToEntity(doc);
        if (entity) {
          await this.entityMapper.save(entity);
        } else {
          Logging.warn(
            "Invalid entity file. SetupService is skipping to import this.",
            fileName,
            doc,
          );
        }
      }
    }
  }

  /**
   * (Try to) convert the given doc to an Entity instance to be saved to the database.
   */
  private parseObjectToEntity(doc: any): Entity | undefined {
    if (!doc || !doc["_id"]) {
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
      // Lazy-load to avoid circular dependency: SetupService is also used/injected in this component
      const { DemoAssistanceDialogComponent } = await import(
        "./demo-assistance-dialog/demo-assistance-dialog.component"
      );
      dialogRef = this.dialog.open(DemoAssistanceDialogComponent, {
        ...commonOptions,
        width: "calc(100% - 100px)",
        disableClose: true,
        hasBackdrop: false,
      });
    }

    return await lastValueFrom(dialogRef.afterClosed());
  }
}
