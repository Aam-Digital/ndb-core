import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

/**
 * A MatFormField to let the user define a FontAwesome icon
 * (showing some additional explanation in the UI).
 */
@Component({
  selector: "app-icon-input",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FaIconComponent,
  ],
  templateUrl: "./icon-input.component.html",
  styleUrl: "./icon-input.component.scss",
})
export class IconComponent implements OnInit, OnChanges {
  @Input() icon: string;
  @Output() iconChange = new EventEmitter<string>();

  iconControl: FormControl;

  ngOnInit(): void {
    this.iconControl = new FormControl(this.icon || "");
    this.iconControl.valueChanges.subscribe((value) =>
      this.iconChange.emit(value),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["icon"] && this.iconControl) {
      this.iconControl.setValue(this.icon || "", { emitEvent: false });
    }
  }
}
