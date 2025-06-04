import { Component, OnInit } from "@angular/core";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { SetupService } from "../setup.service";
import { BaseConfig } from "../base-config";
import { MatButtonModule } from "@angular/material/button";
import { ChooseUseCaseComponent } from "../choose-use-case/choose-use-case.component";
import { Logging } from "../../logging/logging.service";

@Component({
  selector: "app-demo-assistance-dialog",
  imports: [MatDialogModule, MatButtonModule, ChooseUseCaseComponent],
  templateUrl: "./demo-assistance-dialog.component.html",
  styleUrl: "./demo-assistance-dialog.component.scss",
})
export class DemoAssistanceDialogComponent implements OnInit {
  demoAssistanceItems: BaseConfig[] = [];
  selectedUseCase: BaseConfig | null = null;
  demoInitialized: boolean = false;
  generatingData: boolean = false;

  constructor(
    private setupService: SetupService,
    private dialogRef: MatDialogRef<DemoAssistanceDialogComponent>,
  ) {}

  async ngOnInit(): Promise<void> {
    this.demoAssistanceItems = await this.setupService.getAvailableBaseConfig();
  }

  async initializeSystem() {
    if (this.selectedUseCase) {
      this.generatingData = true;
      try {
        await this.setupService.initDemoData(this.selectedUseCase);
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
