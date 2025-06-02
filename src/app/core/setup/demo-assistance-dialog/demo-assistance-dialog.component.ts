import { Component, OnInit } from "@angular/core";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { SetupService } from "../setup.service";
import { BaseConfig } from "../base-config";

import { MatButtonModule } from "@angular/material/button";
import { ChooseUseCaseComponent } from "../choose-use-case/choose-use-case.component";

@Component({
  selector: "app-demo-assistance-dialog",
  imports: [MatDialogModule, MatButtonModule, ChooseUseCaseComponent],
  templateUrl: "./demo-assistance-dialog.component.html",
  styleUrl: "./demo-assistance-dialog.component.scss",
})
export class DemoAssistanceDialogComponent implements OnInit {
  // List of demo assistance items
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
    console.log("Demo Assistance Items:", this.demoAssistanceItems);
  }
  onUseCaseSelected(selected: BaseConfig) {
    console.log("Selected use case:", selected);
    this.selectedUseCase = selected;
  }

  initializeSystem() {
    if (this.selectedUseCase) {
      const result = this.setupService.initDemoData(this.selectedUseCase);
      if (result instanceof Promise) {
        this.generatingData = true;

        result
          .then(() => {
            this.demoInitialized = true;
            this.generatingData = false;
          })
          .catch((error) => {
            console.error("Error initializing demo data:", error);
            this.generatingData = true;
          });
      } else {
        this.generatingData = false;
      }
    }
  }

  startExploring() {
    this.dialogRef.close();
  }
}
