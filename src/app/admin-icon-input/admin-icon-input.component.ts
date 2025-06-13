import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

/**
 * A MatFormField to let the user define a FontAwesome icon
 * (showing some additional explanation in the UI).
 */
@Component({
  selector: "app-admin-icon-input",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FaIconComponent,
  ],
  templateUrl: "./admin-icon-input.component.html",
  styleUrl: "./admin-icon-input.component.scss",
})
export class AdminIconComponent implements OnInit {
  @Input() icon: string;
  @Output() iconChange = new EventEmitter<string>();

  iconControl: FormControl;

  ngOnInit(): void {
    this.iconControl = new FormControl(this.icon || "");
    this.iconControl.valueChanges.subscribe((value) =>
      this.iconChange.emit(value),
    );
  }
}
