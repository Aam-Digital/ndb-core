import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { environment } from "../../../../environments/environment";
import { SetupService } from "../setup.service";

@Component({
  selector: "app-demo-assistant-button",
  imports: [MatButtonModule],
  templateUrl: "./demo-assistant-button.component.html",
  styleUrl: "./demo-assistant-button.component.scss",
})
export class DemoAssistantButtonComponent implements OnInit {
  private readonly setupService = inject(SetupService);

  demoMode: boolean;

  ngOnInit(): void {
    this.demoMode = environment.demo_mode;

    if (this.demoMode) {
      // If we are in demo mode, we open the setup dialog immediately
      // to allow the user to select a base config.
      this.setupService.openDemoSetupDialog();
    }
  }

  openDemoAssistance(): void {
    this.setupService.openDemoSetupDialog();
  }
}
