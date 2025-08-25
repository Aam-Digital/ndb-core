import { AlertService } from "#src/app/core/alerts/alert.service";
import { EntitySelectComponent } from "#src/app/core/common-components/entity-select/entity-select.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { DisableEntityOperationDirective } from "#src/app/core/permissions/permission-directive/disable-entity-operation.directive";
import { Component, inject, Input } from "@angular/core";
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
  @Input() entity: Entity;

  emailTemplateSelectionForm: FormControl = new FormControl();
  EmailTemplate = EmailTemplate;

  constructor() {
    const data = inject<Entity>(MAT_DIALOG_DATA);

    this.entity = data;
  }
}
