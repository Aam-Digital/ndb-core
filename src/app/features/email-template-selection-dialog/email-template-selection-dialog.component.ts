import { AlertService } from "#src/app/core/alerts/alert.service";
import { EntitySelectComponent } from "#src/app/core/common-components/entity-select/entity-select.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { DisableEntityOperationDirective } from "#src/app/core/permissions/permission-directive/disable-entity-operation.directive";
import { Component, inject, Input } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from "@angular/material/dialog";
import { RouterLink } from "@angular/router";
import { EmailTemplate } from "../email-client/email-template.entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";

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

  dialogRef: MatDialogRef<EmailTemplateSelectionDialogComponent>;

  private readonly entityMapper = inject(EntityMapperService);

  constructor() {
    this.dialogRef = inject(
      MatDialogRef<EmailTemplateSelectionDialogComponent>,
    );
  }

  selectedTemplate(template: EmailTemplate) {
    this.emailTemplateSelectionForm.setValue(template);

    const emailTemplate = this.entityMapper.load(
      EmailTemplate.ENTITY_TYPE,
      this.emailTemplateSelectionForm.value,
    );

    this.dialogRef.close(emailTemplate);
  }
}
