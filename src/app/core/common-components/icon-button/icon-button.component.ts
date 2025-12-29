import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

/**
 * A reusable button component that combines an icon with text,
 * following the established patterns for icon+text buttons in the app.
 * Centralizes the common pattern of mat-stroked-button with FontAwesome icon and translatable text.
 */
@Component({
  selector: "app-icon-button",
  templateUrl: "./icon-button.component.html",
  styleUrl: "./icon-button.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, FaIconComponent],
})
export class IconButtonComponent {
  /**
   * The FontAwesome icon name to display (e.g., "edit", "save", "delete")
   */
  icon = input.required<string>();

  /**
   * The type of Material button to use.
   * Defaults to 'mat-stroked-button' which is the most common pattern.
   */
  buttonType = input<
    | "mat-button"
    | "mat-raised-button"
    | "mat-flat-button"
    | "mat-stroked-button"
  >("mat-stroked-button");

  /**
   * Material button color (primary, accent, warn)
   */
  color = input<"primary" | "accent" | "warn" | undefined>(undefined);

  /**
   * Whether the button is disabled
   */
  disabled = input<boolean>(false);

  /**
   * Additional CSS classes to apply to the button
   */
  cssClass = input<string>("");

  /**
   * Button type attribute (button, submit, reset)
   */
  type = input<"button" | "submit" | "reset">("button");

  /**
   * Angulartics2 attributes for analytics tracking
   */
  angulartics2On = input<string | undefined>(undefined);
  angularticsCategory = input<string | undefined>(undefined);
  angularticsAction = input<string | undefined>(undefined);

  /**
   * Event emitted when the button is clicked
   */
  buttonClick = output<Event>();

  /**
   * Handle button click event
   */
  onClick(event: Event): void {
    this.buttonClick.emit(event);
  }
}
