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
 */
@Component({
  selector: "app-icon-button",
  templateUrl: "./icon-button.component.html",
  styleUrl: "./icon-button.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, FaIconComponent],
})
export class IconButtonComponent {
  icon = input.required<string>();
  buttonType = input<
    | "mat-button"
    | "mat-raised-button"
    | "mat-flat-button"
    | "mat-stroked-button"
  >("mat-stroked-button");
  color = input<"primary" | "accent" | "warn" | undefined>(undefined);
  cssClass = input<string>("");
  angulartics2On = input<string | undefined>(undefined);
  angularticsCategory = input<string | undefined>(undefined);
  angularticsAction = input<string | undefined>(undefined);

  buttonClick = output<Event>();

  onClick(event: Event): void {
    this.buttonClick.emit(event);
  }
}
