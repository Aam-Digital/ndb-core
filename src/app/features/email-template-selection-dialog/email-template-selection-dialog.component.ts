import { EntitySelectComponent } from "#src/app/core/common-components/entity-select/entity-select.component";
import { DisableEntityOperationDirective } from "#src/app/core/permissions/permission-directive/disable-entity-operation.directive";
import { Component, inject } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from "@angular/material/dialog";
import { RouterLink } from "@angular/router";
import { EmailTemplate } from "../email-client/email-template.entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "#src/app/core/entity/model/entity";

@Component({
  selector: "app-email-template-selection-dialog",
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    EntitySelectComponent,
    MatDialogClose,
    RouterLink,
    DisableEntityOperationDirective,
  ],
  templateUrl: "./email-template-selection-dialog.component.html",
  styleUrl: "./email-template-selection-dialog.component.scss",
})
export class EmailTemplateSelectionDialogComponent {
  emailTemplateSelectionForm: FormControl = new FormControl();
  EmailTemplate = EmailTemplate;

  private readonly dialogRef = inject(
    MatDialogRef<EmailTemplateSelectionDialogComponent>,
  );
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entity = inject<Entity>(MAT_DIALOG_DATA);

  /**
   * Filters email templates based on their availability for the current entity type.
   * Returns true if the template is available for the entity type or if no restrictions are set.
   *
   * @param e The email template to check.
   * @returns True if the template is available for the current entity type, otherwise false.
   */
  filteredTemplate = (e: EmailTemplate): boolean => {
    const currentType = this.entity.getType();
    if (
      e.availableForEntityTypes &&
      e.availableForEntityTypes.includes(currentType)
    ) {
      return true;
    } else if (
      !e.availableForEntityTypes ||
      e.availableForEntityTypes.length === 0
    ) {
      return true;
    }
    return false;
  };

  selectedTemplate(template: EmailTemplate) {
    this.emailTemplateSelectionForm.setValue(template);

    const emailTemplate = this.entityMapper.load(
      EmailTemplate.ENTITY_TYPE,
      this.emailTemplateSelectionForm.value,
    );

    this.dialogRef.close(emailTemplate);
  }
}
