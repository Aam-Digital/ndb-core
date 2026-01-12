import { Component, inject, OnInit, signal } from "@angular/core";
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
import { environment } from "#src/environments/environment";
import { AssistantService } from "#src/app/core/setup/assistant.service";

/**
 * UI for initial system setup and use case selection,
 * used within the AssistantDialog.
 */
@Component({
  selector: "app-system-init-assistant",
  imports: [
    MatButtonModule,
    ChooseUseCaseComponent,
    LanguageSelectComponent,
    MatCheckbox,
    FormsModule,
  ],
  templateUrl: "./system-init-assistant.component.html",
  styleUrl: "./system-init-assistant.component.scss",
  // changeDetection: ChangeDetectionStrategy.OnPush is not supported here with form state changes yet
})
export class SystemInitAssistantComponent implements OnInit {
  private dialogRef =
    inject<MatDialogRef<SystemInitAssistantComponent>>(MatDialogRef);
  private route = inject(ActivatedRoute);

  private readonly demoDataInitializer = inject(DemoDataInitializerService);
  private readonly setupService = inject(SetupService);

  availableUseCases = signal<BaseConfig[]>([]);
  selectedUseCase = signal<BaseConfig | null>(null);
  generateDemoData = signal<boolean>(environment.demo_mode);

  demoInitialized = signal<boolean>(false);
  generatingData = signal<boolean>(false);
  availableLocales = signal<ConfigurableEnumValue[]>([]);

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
    } catch (error) {
      Logging.error("Error initializing demo data:", error);
    } finally {
      this.generatingData.set(false);
    }
  }

  onUseCaseSelected(selected: BaseConfig) {
    this.selectedUseCase.set(selected);
  }

  startExploring() {
    this.dialogRef.close();
  }
}
