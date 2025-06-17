import { Component, inject, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { ContextAwareAssistantComponent } from "../context-aware-assistant/context-aware-assistant.component";
import { MatTab, MatTabGroup } from "@angular/material/tabs";
import { SystemInitAssistantComponent } from "../system-init-assistant/system-init-assistant.component";
import { ConfigService } from "../../config/config.service";

@Component({
  selector: "app-assistant-dialog",
  imports: [
    ContextAwareAssistantComponent,
    MatTabGroup,
    MatTab,
    SystemInitAssistantComponent,
  ],
  templateUrl: "./assistant-dialog.component.html",
  styleUrl: "./assistant-dialog.component.scss",
})
export class AssistantDialogComponent implements OnInit {
  private readonly configService = inject(ConfigService);

  /**
   * Lists all available assistants and whether they are enabled.
   */
  assistants = {
    initDemo: false,
    contextAwareGuide: false,
    setupWizard: false,
  };

  constructor(private dialogRef: MatDialogRef<AssistantDialogComponent>) {}

  ngOnInit(): void {
    this.detectAssistantModes();
  }

  private detectAssistantModes() {
    if (!this.configService.hasConfig()) {
      this.assistants.initDemo = true;
    } else {
      this.assistants.initDemo = false;
      this.assistants.contextAwareGuide = true;
      //this.assistants.setupWizard = true;
    }
  }
}
