import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { SetupService } from "../setup.service";
import { BaseConfig } from "../base-config";
import { MatButtonModule } from "@angular/material/button";
import { ChooseUseCaseComponent } from "./choose-use-case/choose-use-case.component";
import { Logging } from "../../logging/logging.service";
import { ActivatedRoute } from "@angular/router";
import { DemoDataInitializerService } from "../../demo-data/demo-data-initializer.service";
import { LanguageSelectComponent } from "app/core/language/language-select/language-select.component";
import { availableLocales } from "app/core/language/languages";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { MatDialogRef } from "@angular/material/dialog";
import { MatCheckbox } from "@angular/material/checkbox";
import { FormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { environment } from "#src/environments/environment";
import { AssistantService } from "#src/app/core/setup/assistant.service";
import { UserEntityLinkService } from "../user-entity-link.service";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { EntityFormComponent } from "../../common-components/entity-form/entity-form/entity-form.component";
import { InvalidFormFieldError } from "../../common-components/entity-form/invalid-form-field.error";
import { FieldGroup } from "../../entity-details/form/field-group";
import { AlertService } from "../../alerts/alert.service";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";

/**
 * UI for initial system setup and use case selection,
 * used within the AssistantDialog.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-system-init-assistant",
  imports: [
    MatButtonModule,
    ChooseUseCaseComponent,
    LanguageSelectComponent,
    MatCheckbox,
    FormsModule,
    MatSelectModule,
    EntityFormComponent,
  ],
  templateUrl: "./system-init-assistant.component.html",
  styleUrl: "./system-init-assistant.component.scss",
})
export class SystemInitAssistantComponent implements OnInit {
  private dialogRef =
    inject<MatDialogRef<SystemInitAssistantComponent>>(MatDialogRef);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private location = inject(LOCATION_TOKEN);

  private readonly demoDataInitializer = inject(DemoDataInitializerService);
  private readonly setupService = inject(SetupService);
  private readonly userEntityLinkService = inject(UserEntityLinkService);
  private readonly entityFormService = inject(EntityFormService);
  private readonly alertService = inject(AlertService);

  /** exposed for the template to branch copy that only applies to the public in-memory demo */
  protected readonly environment = environment;

  availableUseCases = signal<BaseConfig[]>([]);
  selectedUseCase = signal<BaseConfig | null>(null);
  generateDemoData = signal<boolean>(environment.demo_mode);

  demoInitialized = signal<boolean>(false);
  generatingData = signal<boolean>(false);
  availableLocales = signal<ConfigurableEnumValue[]>([]);

  /** Whether the "create your profile" step has been evaluated and, if applicable, is shown. */
  profileStepReady = signal<boolean>(false);
  showProfileStep = signal<boolean>(false);
  /** Set when no configured type supports login accounts, to inform the user on the final screen. */
  profileStepNotice = signal<string | null>(null);

  profileEntityTypes = signal<EntityConstructor[]>([]);
  selectedProfileType = signal<EntityConstructor | null>(null);
  profileEntity = signal<Entity | null>(null);
  profileFieldGroups = signal<FieldGroup[]>([]);
  profileForm = signal<EntityForm<Entity> | null>(null);
  savingProfile = signal<boolean>(false);

  async ngOnInit(): Promise<void> {
    this.adjustAssistantDialogPanel();

    this.availableUseCases.set(
      await this.setupService.getAvailableBaseConfig(),
    );
    this.availableLocales.set(this.getAvailableLocalesForUseCases());

    await this.initFromQueryParamAutomatically();
  }

  private adjustAssistantDialogPanel() {
    this.dialogRef.updateSize(
      "calc(100% - 100px)",
      AssistantService.ASSISTANT_DIALOG_HEIGHT,
    );
    this.dialogRef.disableClose = true;
  }

  private getAvailableLocalesForUseCases() {
    const availableDemoLocale = new Set(
      this.availableUseCases()
        .map((useCase) => useCase.locale)
        .filter(Boolean),
    );

    return availableLocales.values.filter((locale) =>
      availableDemoLocale.has(locale.id),
    );
  }

  /**
   * The system can be opened with a pre-selected use case: ?useCase=useCaseId
   * @private
   */
  private async initFromQueryParamAutomatically() {
    const preSelectedUseCase = this.route.snapshot.queryParamMap.get("useCase");
    if (!preSelectedUseCase) {
      return;
    }

    const useCase =
      this.availableUseCases().find(
        (config) =>
          // Using lowercase comparison to avoid mismatches due to URL parameter casing or caching issues
          config.id.toLowerCase() === preSelectedUseCase.toLowerCase(),
      ) || null;

    this.selectedUseCase.set(useCase);

    await this.initializeSystem();
  }

  async initializeSystem() {
    if (!this.selectedUseCase()) {
      return;
    }

    this.generatingData.set(true);

    try {
      await this.setupService.initSystemWithBaseConfig(this.selectedUseCase()!);

      if (this.generateDemoData()) {
        await this.demoDataInitializer.generateDemoData();
      }

      this.demoInitialized.set(true);
      // only after a successful import: on failure there is no new config to read entity
      // types from, and waitForConfigReady() could hang on a system that never got one.
      await this.prepareProfileStep();
    } catch (error) {
      Logging.error("Error initializing demo data:", error);
    } finally {
      this.generatingData.set(false);
    }
  }

  onUseCaseSelected(selected: BaseConfig) {
    this.selectedUseCase.set(selected);
  }

  /**
   * Determine whether to offer linking the just-created account to a profile entity,
   * and if so, prepare the form for it (or for its only option, if there is just one).
   * @private
   */
  private async prepareProfileStep() {
    if (!this.userEntityLinkService.shouldOfferStep()) {
      this.profileStepReady.set(true);
      return;
    }

    await this.setupService.waitForConfigReady();
    const types = this.userEntityLinkService.getUserEntityTypes();

    if (types.length === 0) {
      this.profileStepNotice.set(
        $localize`:no user-linkable type notice:No record type in this configuration supports login accounts, so no profile was created for your account.`,
      );
      this.profileStepReady.set(true);
      return;
    }

    this.profileEntityTypes.set(types);
    this.showProfileStep.set(true);
    this.profileStepReady.set(true);

    if (types.length === 1) {
      await this.selectProfileType(types[0]);
    }
  }

  async onProfileTypeSelected(type: EntityConstructor) {
    await this.selectProfileType(type);
  }

  private async selectProfileType(type: EntityConstructor) {
    this.selectedProfileType.set(type);

    const entity = new type();
    const fieldGroups = this.userEntityLinkService.getProfileFieldGroups(type);
    const fields = fieldGroups.flatMap((group) => group.fields);

    this.profileEntity.set(entity);
    this.profileFieldGroups.set(fieldGroups);
    this.profileForm.set(
      // field-level permission checks are skipped: this runs right after importing the config
      // whose permission rules govern this type, and AbilityService may not have re-applied
      // them yet (no signal exists to await that) - without this, fields could silently render
      // as blank/disabled. The save-time ability check in saveChanges() is separate and not
      // skipped; it fails loudly (a caught error) rather than silently, which is acceptable here.
      await this.entityFormService.createEntityForm(
        fields,
        entity,
        this.destroyRef,
        false,
        false,
      ),
    );
  }

  async saveProfile() {
    const form = this.profileForm();
    const entity = this.profileEntity();
    if (!form || !entity) {
      return;
    }

    this.savingProfile.set(true);
    try {
      const saved = await this.entityFormService.saveChanges(form, entity);

      // the entity is already saved at this point: a failure below must never roll it back,
      // only report that it is not yet linked.
      const linked = await this.userEntityLinkService.linkAccountToEntity(
        saved.getId(),
      );

      if (linked) {
        // reload so Keycloak's next init() issues a token carrying the new `username` claim -
        // writing the attribute server-side does not change the already-issued token.
        this.location.pathname = "";
        return;
      }

      const notLinkedMessage = $localize`:profile created but not linked warning:Your profile "${saved.toString()}:profileName:" was created, but could not be linked to your account automatically. An administrator can link it to your account later from user administration.`;
      // shown twice: as a toast now, and kept on profileStepNotice so the entity id/name is
      // still visible on the final screen even if the toast is missed - it's the only place
      // an admin would otherwise learn there is an orphaned profile to link.
      this.alertService.addWarning(notLinkedMessage);
      this.profileStepNotice.set(notLinkedMessage);
      this.skipProfileStep();
    } catch (err) {
      // InvalidFormFieldError is already surfaced as inline field highlighting - an alert on
      // top would be redundant (same convention as FormComponent.saveClicked).
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
    } finally {
      this.savingProfile.set(false);
    }
  }

  skipProfileStep() {
    this.showProfileStep.set(false);
  }

  startExploring() {
    this.dialogRef.close();
  }
}
