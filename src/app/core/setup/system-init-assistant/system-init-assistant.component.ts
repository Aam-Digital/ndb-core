import { Component, inject, OnInit } from "@angular/core";
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
import { AssistantButtonComponent } from "../assistant-button/assistant-button.component";

/**
 * UI for initial system setup and use case selection,
 * used within the AssistantDialog.
 */
@Component({
  selector: "app-system-init-assistant",
  imports: [MatButtonModule, ChooseUseCaseComponent, LanguageSelectComponent],
  templateUrl: "./system-init-assistant.component.html",
  styleUrl: "./system-init-assistant.component.scss",
})
export class SystemInitAssistantComponent implements OnInit {
  private readonly demoDataInitializer = inject(DemoDataInitializerService);
  private readonly setupService = inject(SetupService);

  demoUseCases: BaseConfig[] = [];
  selectedUseCase: BaseConfig | null = null;
  demoInitialized: boolean = false;
  generatingData: boolean = false;
  availableLocales: ConfigurableEnumValue[];

  constructor(
    private dialogRef: MatDialogRef<SystemInitAssistantComponent>,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit(): Promise<void> {
    this.adjustAssistantDialogPanel();

    this.demoUseCases = await this.setupService.getAvailableBaseConfig();
    this.availableLocales = this.getAvailableLocalesForUseCases();

    await this.initFromQueryParamAutomatically();
  }

  private adjustAssistantDialogPanel() {
    this.dialogRef.updateSize(
      "calc(100% - 100px)",
      AssistantButtonComponent.ASSISTANT_DIALOG_HEIGHT,
    );
    this.dialogRef.disableClose = true;
  }

  private getAvailableLocalesForUseCases() {
    const availableDemoLocale = new Set(
      this.demoUseCases.map((useCase) => useCase.locale).filter(Boolean),
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

    this.selectedUseCase =
      this.demoUseCases.find(
        (config) =>
          // Using lowercase comparison to avoid mismatches due to URL parameter casing or caching issues
          config.id.toLowerCase() === preSelectedUseCase.toLowerCase(),
      ) || null;

    await this.initializeSystem();
  }

  async initializeSystem() {
    if (!this.selectedUseCase) {
      return;
    }

    this.generatingData = true;

    try {
      await this.setupService.initSystemWithBaseConfig(this.selectedUseCase);

      await this.demoDataInitializer.generateDemoData();

      this.demoInitialized = true;
    } catch (error) {
      Logging.error("Error initializing demo data:", error);
    } finally {
      this.generatingData = false;
    }
  }

  onUseCaseSelected(selected: BaseConfig) {
    this.selectedUseCase = selected;
  }

  startExploring() {
    this.dialogRef.close();
  }
}
