import { EditEntityComponent } from "#src/app/core/basic-datatypes/entity/edit-entity/edit-entity.component";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { DisableEntityOperationDirective } from "#src/app/core/permissions/permission-directive/disable-entity-operation.directive";
import { Component, inject, OnInit } from "@angular/core";
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
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterLink } from "@angular/router";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EmailTemplate } from "../email-client/email-template.entity";

export interface EmailTemplateSelectionDialogData {
  entity: Entity;
  excludedEntitiesCount: number;
  isBulk: boolean;
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
    FontAwesomeTestingModule,
    MatTooltipModule,
    MatFormFieldModule,
  ],
  templateUrl: "./email-template-selection-dialog.component.html",
  styleUrl: "./email-template-selection-dialog.component.scss",
})
export class EmailTemplateSelectionDialogComponent implements OnInit {
  emailTemplateSelectionForm: FormControl = new FormControl();
  createNoteControl = new FormControl<boolean>(true);
  sendAsBCC = new FormControl<boolean>(true);
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

  async confirmSelectedTemplate(templateId: string) {
    const selectedTemplate = await this.entityMapper.load(
      EmailTemplate,
      templateId,
    );
    if (!selectedTemplate) return;

    this.dialogRef.close({
      template: selectedTemplate,
      createNote: !!this.createNoteControl.value,
      sendAsBCC: this.isBulkEmail ? !!this.sendAsBCC.value : false,
    } as {
      template: EmailTemplate;
      createNote: boolean;
      sendAsBCC: boolean;
    });
  }
}
