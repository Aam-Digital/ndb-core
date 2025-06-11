import { Component, inject, OnInit } from "@angular/core";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { SetupService } from "../setup.service";
import { BaseConfig } from "../base-config";
import { MatButtonModule } from "@angular/material/button";
import { ChooseUseCaseComponent } from "../choose-use-case/choose-use-case.component";
import { Logging } from "../../logging/logging.service";
import { ActivatedRoute } from "@angular/router";
import { DemoDataInitializerService } from "../../demo-data/demo-data-initializer.service";
import { LanguageSelectComponent } from "app/core/language/language-select/language-select.component";

@Component({
  selector: "app-demo-assistance-dialog",
  imports: [
    MatDialogModule,
    MatButtonModule,
    ChooseUseCaseComponent,
    LanguageSelectComponent,
  ],
  templateUrl: "./demo-assistance-dialog.component.html",
  styleUrl: "./demo-assistance-dialog.component.scss",
})
export class DemoAssistanceDialogComponent implements OnInit {
  private readonly demoDataInitializer = inject(DemoDataInitializerService);
  private readonly setupService = inject(SetupService);

  demoUseCases: BaseConfig[] = [];
  selectedUseCase: BaseConfig | null = null;
  demoInitialized: boolean = false;
  generatingData: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<DemoAssistanceDialogComponent>,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit(): Promise<void> {
    this.demoUseCases = await this.setupService.getAvailableBaseConfig();

    const preSelectedUseCase = this.route.snapshot.queryParamMap.get("useCase");
    if (preSelectedUseCase) {
      this.selectedUseCase =
        this.demoUseCases.find(
          (config) =>
            // Using lowercase comparison to avoid mismatches due to URL parameter casing or caching issues
            config.id.toLowerCase() === preSelectedUseCase.toLowerCase(),
        ) || null;
      this.initializeSystem();
    }
  }

  async initializeSystem() {
    if (this.selectedUseCase) {
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
  }

  onUseCaseSelected(selected: BaseConfig) {
    this.selectedUseCase = selected;
  }

  startExploring() {
    this.dialogRef.close();
  }
}
