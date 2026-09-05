import {
  Component,
  inject,
  input,
  model,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { TranslatableText } from "../../../config/multi-lingual-config";
import { TranslatableTextInputComponent } from "../../../config/translatable-text-input/translatable-text-input.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-section-header",
  imports: [
    FaIconComponent,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatableTextInputComponent,
  ],
  templateUrl: "./admin-section-header.component.html",
  styleUrl: "./admin-section-header.component.scss",
})
export class AdminSectionHeaderComponent {
  private confirmationDialog = inject(ConfirmationDialogService);

  title = model<TranslatableText>("");

  /** supports two-way data binding for the editable title: `<app-admin-section-header [(title)]="section.title"` */
  remove = output();

  /** disable the confirmation dialog displayed before a remove output is emitted */
  disableConfirmation = input<boolean>(false);

  /**
   * Whether this title may be configured in several languages.
   *
   * Off by default: some titles double as identifiers (e.g. a list view's column
   * group name is referenced by `columnGroups.default`), and those must stay
   * plain strings.
   */
  translatable = input<boolean>(false);

  /** overwrite the label (default: "title") displayed for the form field */
  label = input<string>(
    $localize`:Admin UI - Config Section Header form field label:Title`,
  );

  async removeSection() {
    if (this.disableConfirmation()) {
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
