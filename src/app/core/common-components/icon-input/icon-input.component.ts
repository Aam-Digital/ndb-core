import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class IconComponent implements OnInit {
  private readonly iconLibrary = inject(FaIconLibrary);
  private readonly destroyRef = inject(DestroyRef);

  icon = input<string>();
  control = input<FormControl<string | null>>();
  iconChange = output<string>();

  iconControl: FormControl<string | null>;

  constructor() {
    effect(() => {
      const iconValue = this.icon();
      const externalControl = this.control();
      if (this.iconControl && !externalControl) {
        // Imperative FormControl sync is a side effect; keep this in effect (not computed).
        this.iconControl.setValue(iconValue || "", { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    const iconValidator = this.createIconValidator();
    const ctrl = this.control();
    if (ctrl) {
      ctrl.addValidators(iconValidator);
      ctrl.updateValueAndValidity({ emitEvent: false });
      this.iconControl = ctrl;
    } else {
      this.iconControl = new FormControl<string | null>(this.icon() || "", {
        validators: [iconValidator],
      });
    }

    this.iconControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.iconChange.emit(value || ""));
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
