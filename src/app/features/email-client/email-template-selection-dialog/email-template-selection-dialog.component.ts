import { EditEntityComponent } from "#src/app/core/basic-datatypes/entity/edit-entity/edit-entity.component";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { DisableEntityOperationDirective } from "#src/app/core/permissions/permission-directive/disable-entity-operation.directive";
import { Component, inject, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatCheckbox } from "@angular/material/checkbox";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterLink } from "@angular/router";
<<<<<<< HEAD:src/app/features/email-template-selection-dialog/email-template-selection-dialog.component.ts
import { EmailTemplate } from "../email-client/email-template.entity";
=======
import { EmailTemplate } from "../email-template.entity";
import { HelpButtonComponent } from "#src/app/core/common-components/help-button/help-button.component";
>>>>>>> upstream/master:src/app/features/email-client/email-template-selection-dialog/email-template-selection-dialog.component.ts

/**
 * Input to prefill the email template selection dialog
 * with the relevant context.
 */
export interface EmailTemplateSelectionDialogData {
  entity: Entity;
  excludedEntitiesCount: number;
  isBulk: boolean;
}

/**
 * Output of the email template selection dialog
 * when the user selects and confirms.
 */
export interface EmailTemplateSelectionResult {
  template: EmailTemplate;
  createNote: boolean;
  sendAsBCC: boolean;
  sendSemicolonSeparated: boolean;
}

@Component({
  selector: "app-email-template-selection-dialog",
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    EditEntityComponent,
    MatDialogClose,
    RouterLink,
    DisableEntityOperationDirective,
    MatCheckbox,
    ReactiveFormsModule,
    MatTooltipModule,
    MatFormFieldModule,
    HelpButtonComponent,
  ],
  templateUrl: "./email-template-selection-dialog.component.html",
  styleUrl: "./email-template-selection-dialog.component.scss",
})
export class EmailTemplateSelectionDialogComponent implements OnInit {
  emailTemplateSelectionForm: FormControl = new FormControl();
  emailContentForm = new FormGroup({
    subject: new FormControl<string>("Subject"),
    body: new FormControl<string>(""),
  });
  createNoteControl = new FormControl<boolean>(true);
  sendAsBCC = new FormControl<boolean>(true);
  sendSemicolonSeparated = new FormControl<boolean>(false);
  EmailTemplate = EmailTemplate;
  excludedEntitiesCount: number = 0;
  isBulkEmail: boolean = false;

  private readonly dialogRef = inject(
    MatDialogRef<EmailTemplateSelectionDialogComponent>,
  );
  private readonly entityMapper = inject(EntityMapperService);
  private readonly dialogData: EmailTemplateSelectionDialogData =
    inject(MAT_DIALOG_DATA);

  get entity(): Entity {
    return this.dialogData.entity;
  }

  selectedTemplate = signal<EmailTemplate | null>(null);

  async ngOnInit() {
    this.excludedEntitiesCount = this.dialogData.excludedEntitiesCount ?? 0;
    this.isBulkEmail = this.dialogData.isBulk;
  }
  /**
   * Filter email templates to show based on current entity type.
   * Shows only templates explicitly matching the entity type if any exist,
   * otherwise shows templates with no restrictions (null or empty availableForEntityTypes).
   */
  filteredTemplate = (e: EmailTemplate): boolean =>
    !e.availableForEntityTypes ||
    e.availableForEntityTypes.length === 0 ||
    e.availableForEntityTypes.includes(this.entity.getType());

  async confirmSelectedTemplate(templateId: string | null) {
    let template: EmailTemplate;

    if (templateId) {
      const loadedTemplate = await this.entityMapper.load(
        EmailTemplate,
        templateId,
      );
      if (!loadedTemplate) return;
      template = loadedTemplate;
    } else {
      if (this.emailContentForm.invalid) {
        return;
      }

      template = new EmailTemplate();
      template.subject = this.emailContentForm.value.subject || "";
      template.body = this.emailContentForm.value.body || "";
    }

    this.dialogRef.close({
      template,
      createNote: !!this.createNoteControl.value,
      sendAsBCC: this.isBulkEmail ? !!this.sendAsBCC.value : false,
      sendSemicolonSeparated: !!this.sendSemicolonSeparated.value,
    } as EmailTemplateSelectionResult);
  }
}
