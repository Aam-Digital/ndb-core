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
import { EmailTemplate } from "../email-template.entity";
import { HelpButtonComponent } from "#src/app/core/common-components/help-button/help-button.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { switchMap, tap, distinctUntilChanged, filter } from "rxjs/operators";
import { from, of } from "rxjs";

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

@UntilDestroy()
@Component({
  selector: "app-email-template-selection-dialog",
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    EditEntityComponent,
    MatDialogClose,
    MatInputModule,
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

  async ngOnInit() {
    this.excludedEntitiesCount = this.dialogData.excludedEntitiesCount ?? 0;
    this.isBulkEmail = this.dialogData.isBulk;

    // Listen to template selection changes and prefill subject/body

    this.emailTemplateSelectionForm.valueChanges
      .pipe(
        distinctUntilChanged(),
        switchMap((templateId: string) => {
          if (!templateId) {
            return of(null);
          }
          return from(this.entityMapper.load(EmailTemplate, templateId));
        }),
        untilDestroyed(this),
      )
      .subscribe((template: EmailTemplate | null) => {
        if (template) {
          this.emailContentForm.patchValue({
            subject: template.subject,
            body: template.body,
          });
        } else {
          this.emailContentForm.patchValue({
            subject: "Subject",
            body: "",
          });
        }
      });
  }

  /**
   * Filter email templates to show based on current entity type.
   * Shows only templates explicitly matching the entity type if any exist,
   * otherwise shows templates with no restrictions (null or empty availableForEntityTypes).
   */
  filteredTemplate = (e: EmailTemplate): boolean => {
    return (
      !e.availableForEntityTypes ||
      e.availableForEntityTypes.length === 0 ||
      e.availableForEntityTypes.includes(this.entity.getType())
    );
  };

  async confirmSelectedTemplate() {
    const template = new EmailTemplate();
    template.subject = this.emailContentForm.value.subject;
    template.body = this.emailContentForm.value.body;

    this.dialogRef.close({
      template,
      createNote: !!this.createNoteControl.value,
      sendAsBCC: this.isBulkEmail ? !!this.sendAsBCC.value : false,
      sendSemicolonSeparated: !!this.sendSemicolonSeparated.value,
    } as EmailTemplateSelectionResult);
  }
}
