import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

/**
 * Simple building block for UI Builder for a section title including button to remove the section.
 *
 * Supports two-way binding for the title.
 *
 * add css class "section-container" and import this component's scss in the parent's styleUrl
 * to get visual highlighting on hovering over the remove button,
 * or copy the style from there.
 * LIMITATION: multiple hierarchies each using this have to define seperate container classes, otherwise styles will leak
 */
@Component({
  selector: "app-config-section-header",
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: "./config-section-header.component.html",
  styleUrl: "./config-section-header.component.scss",
})
export class ConfigSectionHeaderComponent {
  @Input() title: string;

  /** supports two-way data binding for the editable title: `<app-config-section-header [(title)]="section.title"` */
  @Output() titleChange = new EventEmitter<string>();

  @Output() remove = new EventEmitter();
}
