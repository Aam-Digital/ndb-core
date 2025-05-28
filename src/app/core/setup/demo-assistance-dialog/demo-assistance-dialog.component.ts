import { Component, OnInit } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDivider, MatListModule } from "@angular/material/list";
import { SetupService } from "../setup.service";
import { BaseConfig } from "../base-config";
import { MatSelect } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatButtonModule } from "@angular/material/button";
import { ChooseUseCaseComponent } from "../choose-use-case/choose-use-case.component";

@Component({
  selector: "app-demo-assistance-dialog",
  imports: [
    MatDialogModule,
    MatListModule,
    MatButtonModule,
    ChooseUseCaseComponent,
  ],
  templateUrl: "./demo-assistance-dialog.component.html",
  styleUrl: "./demo-assistance-dialog.component.scss",
})
export class DemoAssistanceDialogComponent implements OnInit {
  // List of demo assistance items
  demoAssistanceItems: BaseConfig[] = [];
  selectedUseCase: BaseConfig | null = null;

  constructor(private setupService: SetupService) {}

  async ngOnInit(): Promise<void> {
    // Initialization logic if needed
    this.demoAssistanceItems = await this.setupService.getAvailableBaseConfig();
    console.log("Demo Assistance Items:", this.demoAssistanceItems);
  }
  onUseCaseSelected(selected: BaseConfig) {
    console.log("Selected use case:", selected);
    this.selectedUseCase = selected;
  }

  initializeSystem() {
    if (this.selectedUseCase) {
      console.log("Selected use case with dialog:", this.selectedUseCase);
      this.setupService.initSystemWithBaseConfig(this.selectedUseCase);
    }
  }
}
