import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * Simple form field for admins to select the "anonymize" mode for an entity field.
 * Displays tooltips as descriptions also.
 */
@Component({
  selector: "app-anonymize-options",
  standalone: true,
  imports: [CommonModule, MatOptionModule, MatSelectModule, MatTooltipModule],
  templateUrl: "./anonymize-options.component.html",
  styleUrl: "./anonymize-options.component.scss",
})
export class AnonymizeOptionsComponent implements OnInit {
  @Input() value: string;
  @Output() valueChange = new EventEmitter<string>();

  ngOnInit(): void {
    if (!this.value) {
      this.value = "";
    }
  }
}
