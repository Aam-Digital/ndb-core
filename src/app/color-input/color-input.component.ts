import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgTemplateOutlet } from "@angular/common";

@Component({
  selector: "app-color-input",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    MatTooltipModule,
    NgTemplateOutlet,
  ],
  templateUrl: "./color-input.component.html",
  styleUrl: "./color-input.component.scss",
})
export class ColorInputComponent implements OnInit, OnChanges {
  @Input() color: string = "";
  @Input() hideTextField = false;
  @Input() compact = false;
  @Output() colorChange = new EventEmitter<string>();

  colorControl = new FormControl("");

  ngOnInit() {
    this.colorControl.setValue(this.color || "");
    this.colorControl.valueChanges.subscribe((val) => {
      if (val !== this.color) {
        this.onColorChange(val);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["color"] && this.colorControl.value !== this.color) {
      this.colorControl.setValue(this.color || "", { emitEvent: false });
    }
  }

  onColorChange(value: string) {
    this.color = value;
    this.colorControl.setValue(value, { emitEvent: false });
    this.colorChange.emit(value);
  }
}
