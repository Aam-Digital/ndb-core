import { EntitySelectComponent } from "#src/app/core/common-components/entity-select/entity-select.component";
import { DisableEntityOperationDirective } from "#src/app/core/permissions/permission-directive/disable-entity-operation.directive";
import { Component, inject, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
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
import { MatCheckbox } from "@angular/material/checkbox";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MatTooltipModule } from "@angular/material/tooltip";

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
    MatCheckbox,
    ReactiveFormsModule,
    FontAwesomeTestingModule,
    MatTooltipModule,
  ],
  templateUrl: "./email-template-selection-dialog.component.html",
  styleUrl: "./email-template-selection-dialog.component.scss",
})
export class EmailTemplateSelectionDialogComponent implements OnInit {
  emailTemplateSelectionForm: FormControl = new FormControl();
  createNoteControl = new FormControl<boolean>(true);
  sendAsBCC = new FormControl<boolean>(true);
  EmailTemplate = EmailTemplate;
  availableTemplates: EmailTemplate[] = [];
  excludedEntityCount: number = 0;
  isBulkEmail: boolean = false;

  private readonly dialogRef = inject(
    MatDialogRef<EmailTemplateSelectionDialogComponent>,
  );
  private readonly entityMapper = inject(EntityMapperService);
  private readonly dialogData = inject(MAT_DIALOG_DATA) as {
    entity: Entity;
    excludedEntityCount: number;
    isBulk: boolean;
  };

  get entity(): Entity {
    return this.dialogData.entity;
  }

  async ngOnInit() {
    this.availableTemplates = (await this.entityMapper.loadType(
      EmailTemplate.ENTITY_TYPE,
    )) as EmailTemplate[];

    this.excludedEntityCount = this.dialogData.excludedEntityCount ?? 0;
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
