import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";
import { SetupService } from "../setup.service";
import { BaseConfig, isOfferedInLocale } from "../base-config";
import { MatButtonModule } from "@angular/material/button";
import { ChooseUseCaseComponent } from "./choose-use-case/choose-use-case.component";
import { Logging } from "../../logging/logging.service";
import { ActivatedRoute } from "@angular/router";
import { DemoDataInitializerService } from "../../demo-data/demo-data-initializer.service";
import { LanguageSelectComponent } from "app/core/language/language-select/language-select.component";
import { LanguageService } from "app/core/language/language.service";
import { availableLocales } from "app/core/language/languages";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { MatDialogRef } from "@angular/material/dialog";
import { MatCheckbox } from "@angular/material/checkbox";
import { FormsModule } from "@angular/forms";
import { environment } from "#src/environments/environment";
import { AssistantService } from "#src/app/core/setup/assistant.service";
import { UserProfileSetupComponent } from "./user-profile-setup/user-profile-setup.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { SiteSettingsService } from "#src/app/core/site-settings/site-settings.service";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { isConnectivityError } from "#src/app/utils/connectivity-error";

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
    UserProfileSetupComponent,
    FaIconComponent,
  ],
  templateUrl: "./system-init-assistant.component.html",
  styleUrl: "./system-init-assistant.component.scss",
})
export class SystemInitAssistantComponent implements OnInit {
  private dialogRef =
    inject<MatDialogRef<SystemInitAssistantComponent>>(MatDialogRef);
  private route = inject(ActivatedRoute);
  private readonly languageService = inject(LanguageService);
  private readonly siteSettings = inject(SiteSettingsService);
  private readonly alertService = inject(AlertService);
  private readonly languageSelect = viewChild(LanguageSelectComponent);

  private readonly demoDataInitializer = inject(DemoDataInitializerService);
  protected readonly setupService = inject(SetupService);

  /** exposed for the template to branch copy that only applies to the public in-memory demo */
  protected readonly environment = environment;

  availableUseCases = signal<BaseConfig[]>([]);
  selectedUseCase = signal<BaseConfig | null>(null);
  generateDemoData = signal<boolean>(environment.demo_mode);

  demoInitialized = signal<boolean>(false);
  generatingData = signal<boolean>(false);
  availableLocales = signal<ConfigurableEnumValue[]>([]);
  savingLanguage = signal<boolean>(false);

  /** Whether the "create your profile" step has run its course (shown or not). */
  profileStepDone = signal<boolean>(false);
  /** What the profile step left to report on the final screen, if anything. */
  profileStepNotice = signal<string | null>(null);

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

  /**
   * Offers a language only if some use case can be set up in it.
   * A use case without a locale is offered in every language, so all of them can be chosen then.
   *
   * The language the app currently runs in is always listed, even if no use case
   * exists for it (or none could be loaded): otherwise the selector would show
   * nothing selected. The use case list handles that case itself, see ChooseUseCaseComponent.
   */
  private getAvailableLocalesForUseCases() {
    const current = this.languageService.getCurrentLocale();
    return availableLocales.values.filter(
      (locale) =>
        locale.id === current ||
        this.availableUseCases().some((useCase) =>
          isOfferedInLocale(useCase, locale.id),
        ),
    );
  }

  /**
   * The language picked here becomes the default language for all users
   * (also if users can not switch languages themselves later).
   * It is saved before applying it, because applying it reloads the app.
   */
  async onLanguageSelected(localeId: string) {
    const locale = this.availableLocales().find((l) => l.id === localeId);
    if (!locale || this.savingLanguage()) {
      return;
    }

    this.savingLanguage.set(true);
    try {
      await this.siteSettings.setDefaultLanguage(locale);
      this.languageService.switchLocale(localeId);
    } catch (err) {
      this.languageSelect()?.resetToCurrent();
      if (isConnectivityError(err)) {
        Logging.debug("Could not save the default language", err);
      } else {
        Logging.warn("Failed to save the default language", err);
      }
      this.alertService.addDanger(
        $localize`The language could not be saved. Please try again.`,
      );
    } finally {
      this.savingLanguage.set(false);
    }
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
      await this.saveSelectedLanguageAsDefaultLanguage();

      if (this.generateDemoData()) {
        await this.demoDataInitializer.generateDemoData();
      }

      // this also mounts the profile step, which relies on a config having been imported
      // successfully - on failure there is none to read entity types from.
      this.demoInitialized.set(true);
    } catch (error) {
      Logging.error("Error initializing demo data:", error);
    } finally {
      this.generatingData.set(false);
    }
  }

  /**
   * The language selected here always becomes the default language, also if it was
   * only preselected and over a language the imported site settings define.
   */
  private async saveSelectedLanguageAsDefaultLanguage() {
    const currentLocale = this.languageService.getCurrentLocale();
    const locale = availableLocales.values.find((l) => l.id === currentLocale);
    if (locale) {
      await this.siteSettings.setDefaultLanguage(locale);
    }
  }

  onUseCaseSelected(selected: BaseConfig | null) {
    this.selectedUseCase.set(selected);
  }

  onProfileStepCompleted(notice: string | null) {
    this.profileStepNotice.set(notice);
    this.profileStepDone.set(true);
  }

  startExploring() {
    this.dialogRef.close();
  }
}
