import { Component, EventEmitter, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-demo-assistant-button",
  imports: [MatButtonModule],
  template: `
    <button
      mat-raised-button
      color="accent"
      class="demo-assistant-btn"
      (click)="openDemoAssistance.emit()"
    >
      <span i18n>Demo</span>
      <span i18n>Assistant</span>
    </button>
  `,
  styleUrl: "./demo-assistant-button.component.scss",
})
export class DemoAssistantButtonComponent {
  @Output() openDemoAssistance = new EventEmitter<void>();
}
