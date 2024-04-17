import { Component, Inject, Input } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { NgForOf } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { DynamicValidator } from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";


@Component({
  selector: 'app-configure-validator-popup',
  standalone: true,
  imports: [    MatDialogModule,
    NgForOf,
    MatFormFieldModule,
    MatInputModule,
    DialogCloseComponent,
    FormsModule,
    CdkDropList,
    CdkDrag,
    MatCheckboxModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    MatButtonModule,],
  templateUrl: './configure-validator-popup.component.html',
  styleUrl: './configure-validator-popup.component.scss'
})
export class ConfigureValidatorPopupComponent {
  fieldId: string;
  validatorForm: FormGroup;
 entityType: EntityConstructor;

  entitySchemaField: EntitySchemaField;


 constructor(
  @Inject(MAT_DIALOG_DATA) public data: any,

    private formBuilder: FormBuilder
) {
    this.validatorForm = this.formBuilder.group({
        required: [false],
        min: [null],
        max: [null],
        regex: [''],
        validEmail: [false],
        uniqueId: ['']
    });
}

ngOnInit()
{                                
  this.fieldId = this.data.fieldId
  // this.entitySchemaField = this.entityType.schema.get(this.fieldId) ?? {};

  console.log(this.data,"hello")
  console.log(this.entitySchemaField,"hello")

} 


  async save() {
  }


}
