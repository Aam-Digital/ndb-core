import { Component, Input } from "@angular/core";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { NgIf } from "@angular/common";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * Display a help button that shows the user additional guidance and explanations when necessary
 * as the user clicks on it.
 */
@Component({
  selector: "app-help-button",
  templateUrl: "./help-button.component.html",
  styleUrls: ["./help-button.component.scss"],
  standalone: true,
  imports: [FontAwesomeModule, MatButtonModule, NgIf, MatTooltipModule],
})
export class HelpButtonComponent {
  /**
   * Help text to be displayed
   */
  @Input() text: string;
}
