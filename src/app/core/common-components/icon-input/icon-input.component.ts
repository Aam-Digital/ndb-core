import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from "@angular/core";
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import {
  FaIconComponent,
  FaIconLibrary,
} from "@fortawesome/angular-fontawesome";
import { resolveIconDefinition } from "../fa-dynamic-icon/fa-icon-utils";

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
  private readonly iconLibrary = inject(FaIconLibrary);

  @Input() icon: string;
  @Input() control?: FormControl<string | null>;
  @Output() iconChange = new EventEmitter<string>();

  iconControl: FormControl<string | null>;

  ngOnInit(): void {
    const iconValidator = this.createIconValidator();
    if (this.control) {
      this.control.addValidators(iconValidator);
      this.control.updateValueAndValidity({ emitEvent: false });
      this.iconControl = this.control;
    } else {
      this.iconControl = new FormControl<string | null>(this.icon || "", {
        validators: [iconValidator],
      });
    }

    this.iconControl.valueChanges.subscribe((value) =>
      this.iconChange.emit(value || ""),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["icon"] && this.iconControl && !this.control) {
      this.iconControl.setValue(this.icon || "", { emitEvent: false });
    }
  }

  private createIconValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value =
        typeof control.value === "string" ? control.value.trim() : "";
      if (!value) {
        return null;
      }
      const definition = resolveIconDefinition(value, this.iconLibrary);
      return definition ? null : { invalidIcon: true };
    };
  }
}
