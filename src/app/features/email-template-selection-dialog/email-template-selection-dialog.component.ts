import { EntitySelectComponent } from "#src/app/core/common-components/entity-select/entity-select.component";
import { DisableEntityOperationDirective } from "#src/app/core/permissions/permission-directive/disable-entity-operation.directive";
import { Component, inject, OnInit } from "@angular/core";
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
export class EmailTemplateSelectionDialogComponent implements OnInit {
  emailTemplateSelectionForm: FormControl = new FormControl();
  EmailTemplate = EmailTemplate;
  availableTemplates: EmailTemplate[] = [];

  private readonly dialogRef = inject(
    MatDialogRef<EmailTemplateSelectionDialogComponent>,
  );
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entity = inject<Entity>(MAT_DIALOG_DATA);

  async ngOnInit() {
    this.availableTemplates = (await this.entityMapper.loadType(
      EmailTemplate.ENTITY_TYPE,
    )) as EmailTemplate[];
  }

  /**
   * Filter email templates to show based on current entity type.
   * Shows only templates explicitly matching the entity type if any exist,
   * otherwise shows templates with no restrictions (null or empty availableForEntityTypes).
   *
   * @param e - An EmailTemplate instance to test.
   * @returns true if the template should be shown, false otherwise.
   */
  filteredTemplate = (e: EmailTemplate): boolean => {
    const currentType = this.entity.getType();
    const matchedTemplate = this.availableTemplates.some(
      (t) =>
        Array.isArray(t.availableForEntityTypes) &&
        t.availableForEntityTypes.includes(currentType),
    );

    if (matchedTemplate) {
      // Show only templates explicitly for current entity type
      return (
        Array.isArray(e.availableForEntityTypes) &&
        e.availableForEntityTypes.includes(currentType)
      );
    } else {
      return (
        !Array.isArray(e.availableForEntityTypes) ||
        e.availableForEntityTypes.length === 0
      );
    }
  };

  confirmSelectedTemplate() {
    const selectedTemplate = this.availableTemplates.find(
      (template: EmailTemplate) =>
        template.getId() === this.emailTemplateSelectionForm.value,
    );
    this.dialogRef.close(selectedTemplate);
  }
}
