import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";

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
  selector: "app-admin-section-header",
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: "./admin-section-header.component.html",
  styleUrl: "./admin-section-header.component.scss",
})
export class AdminSectionHeaderComponent {
  @Input() title: string;

  /** supports two-way data binding for the editable title: `<app-admin-section-header [(title)]="section.title"` */
  @Output() titleChange = new EventEmitter<string>();

  @Output() remove = new EventEmitter();

  /** disable the confirmation dialog displayed before a remove output is emitted */
  @Input() disableConfirmation = false;

  /** overwrite the label (default: "title") displayed for the form field */
  @Input()
  label = $localize`:Admin UI - Config Section Header form field label:Title`;

  constructor(private confirmationDialog: ConfirmationDialogService) {}

  async removeSection() {
    if (this.disableConfirmation) {
      this.remove.emit();
      return;
    }

    const confirmation = await this.confirmationDialog.getConfirmation(
      $localize`:Admin UI - Delete Section Confirmation Title:Delete Section?`,
      $localize`:Admin UI - Delete Section Confirmation Text:Do you really want to delete this section with all its content?`,
    );
    if (confirmation) {
      this.remove.emit();
    }
  }
}
