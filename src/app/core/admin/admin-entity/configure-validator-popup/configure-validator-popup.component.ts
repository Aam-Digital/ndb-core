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
import {  EntityConstructor } from "../../../entity/model/entity";
import { AdminEntityService } from "../../admin-entity.service";
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
  form: FormGroup;
 @Input() entityConstructor: EntityConstructor;
  @Input() entitySchemaField: EntitySchemaField;

 constructor(
  private fb: FormBuilder,
    private adminEntityService: AdminEntityService,
) {}

ngOnInit()
{
  this.init();           

  // this.fieldId = this.data.fieldId

  console.log(this.entitySchemaField,"hello")

} 
private init() {

  if(this.entitySchemaField.validators)
    {
      this.validatorForm = this.fb.group({
        required: [this.entitySchemaField.validators.required ],
        min: [this.entitySchemaField.validators.min] ,
        max: [this.entitySchemaField.validators.max ],
        regex: [this.entitySchemaField.validators.pattern ],      
           validEmail: [this.entitySchemaField.validators.validEmail ],
        uniqueId: [this.entitySchemaField.validators.uniqueId]    });
     
    } else {
    this.validatorForm = this.fb.group({
      required: [false],
      min: [null],
      max: [null],
      regex: [''],
      validEmail: [false],
      uniqueId: ['']
  });
}
this.form = this.fb.group({
  validatorForm: this.validatorForm,
});
}

  async save() {
    // const selectedFielddetails =
    // this.data.data;
    // console.log(this.validatorForm,"form")
    // const updatedEntitySchemaMerged = Object.assign(
    //   { _isCustomizedField: true },
    //   this.entitySchemaField,
    //   selectedFielddetails,
    // );
    // console.log(updatedEntitySchemaMerged,"hello22")

    // this.adminEntityService.updateSchemaField(
    //   this.entityConstructor,
    //   this.fieldId,
    //   updatedEntitySchemaMerged,
    // );
  }


}
