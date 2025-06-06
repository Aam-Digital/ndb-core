import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { SetupService } from "../setup.service";
import { BaseConfig } from "../base-config";
import { MatButtonModule } from "@angular/material/button";
import { ChooseUseCaseComponent } from "../choose-use-case/choose-use-case.component";
import { Logging } from "../../logging/logging.service";
import { ActivatedRoute } from "@angular/router";
import { WINDOW_TOKEN } from "app/utils/di-tokens";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "app/core/language/language-statics";

@Component({
  selector: "app-demo-assistance-dialog",
  imports: [MatDialogModule, MatButtonModule, ChooseUseCaseComponent],
  templateUrl: "./demo-assistance-dialog.component.html",
  styleUrl: "./demo-assistance-dialog.component.scss",
})
export class DemoAssistanceDialogComponent implements OnInit {
  demoUseCases: BaseConfig[] = [];
  selectedUseCase: BaseConfig | null = null;
  demoInitialized: boolean = false;
  generatingData: boolean = false;

  constructor(
    private setupService: SetupService,
    private dialogRef: MatDialogRef<DemoAssistanceDialogComponent>,
    private route: ActivatedRoute,
    @Inject(WINDOW_TOKEN) private window: Window,
  ) {}

  async ngOnInit(): Promise<void> {
    this.demoUseCases = await this.setupService.getAvailableBaseConfig();

    const preSelectedUseCase = this.route.snapshot.queryParamMap.get("useCase");
    if (preSelectedUseCase) {
      this.selectedUseCase =
        this.demoUseCases.find(
          (config) => config.name === preSelectedUseCase,
        ) || null;
      this.initializeSystem();
    }
  }

  async initializeSystem() {
    if (this.selectedUseCase) {
      this.generatingData = true;

      if (this.selectedUseCase?.locale) {
        this.window.localStorage.setItem(
          LANGUAGE_LOCAL_STORAGE_KEY,
          this.selectedUseCase.locale,
        );
      }
      try {
        await this.setupService.initSystem(this.selectedUseCase);
        this.demoInitialized = true;
      } catch (error) {
        Logging.error("Error initializing demo data:", error);
      } finally {
        this.generatingData = false;
      }
    }
  }

  onUseCaseSelected(selected: BaseConfig) {
    this.selectedUseCase = selected;
  }

  startExploring() {
    this.dialogRef.close();
  }
}
