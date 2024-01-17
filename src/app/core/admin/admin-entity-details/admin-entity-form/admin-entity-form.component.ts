import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { EntityFormService } from "../../../common-components/entity-form/entity-form.service";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { AdminEntityFieldComponent } from "../admin-entity-field/admin-entity-field.component";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../../../common-components/entity-form/FormConfig";
import { AdminEntityService } from "../../admin-entity.service";
import { lastValueFrom } from "rxjs";
import { NgForOf, NgIf } from "@angular/common";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatCardModule } from "@angular/material/card";
import { EntityFieldLabelComponent } from "../../../common-components/entity-field-label/entity-field-label.component";
import { EntityFieldEditComponent } from "../../../common-components/entity-field-edit/entity-field-edit.component";
import { AdminSectionHeaderComponent } from "../admin-section-header/admin-section-header.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { FormConfig } from "../../../entity-details/form/form.component";

@UntilDestroy()
@Component({
  selector: "app-admin-entity-form",
  templateUrl: "./admin-entity-form.component.html",
  styleUrls: [
    "./admin-entity-form.component.scss",
    "../admin-section-header/admin-section-header.component.scss",
    "../../../common-components/entity-form/entity-form/entity-form.component.scss",
  ],
  standalone: true,
  imports: [
    DragDropModule,
    NgForOf,
    FaIconComponent,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    EntityFieldLabelComponent,
    EntityFieldEditComponent,
    AdminSectionHeaderComponent,
    NgIf,
  ],
})
export class AdminEntityFormComponent implements OnChanges {
  @Input() entityType: EntityConstructor;

  @Input() config: FormConfig;

  dummyEntity: Entity;
  dummyForm: FormGroup;

  availableFields: ColumnConfig[] = [];
  readonly createNewFieldPlaceholder: FormFieldConfig = {
    id: null,
    label: $localize`:Label drag and drop item:Create New Field`,
  };

  constructor(
    private entityFormService: EntityFormService,
    private matDialog: MatDialog,
    adminEntityService: AdminEntityService,
  ) {
    adminEntityService.entitySchemaUpdated
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.availableFields = []; // force re-init of the label components that otherwise do not detect the change
        setTimeout(() => this.initForm());
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config) {
      this.initForm();
    }
  }

  private initForm() {
    this.initAvailableFields();

    this.dummyEntity = new this.entityType();
    this.dummyForm = this.entityFormService.createFormGroup(
      [...this.getUsedFields(this.config), ...this.availableFields],
      this.dummyEntity,
    );
    this.dummyForm.disable();
  }

  private getUsedFields(config: FormConfig): ColumnConfig[] {
    return config.fieldGroups.reduce((p, c) => p.concat(c.fields), []);
  }

  /**
   * Load any fields from schema that are not already in the form, so that the user can drag them into the form.
   * @param config
   * @private
   */
  private initAvailableFields() {
    const usedFields = this.getUsedFields(this.config);
    const unusedFields = Array.from(this.entityType.schema.entries())
      .filter(
        ([key]) =>
          !usedFields.some(
            (x) => x === key || (x as FormFieldConfig).id === key,
          ),
      )
      .filter(([key, value]) => value.label) // no technical, internal fields
      .sort(([aId, a], [bId, b]) => a.label.localeCompare(b.label))
      .map(([key]) => key);

    this.availableFields = [this.createNewFieldPlaceholder, ...unusedFields];
  }

  /**
   * Open the form to edit details of a single field's schema.
   *
   * @param field field to edit or { id: null } to create a new field
   * @returns the id of the field that was edited or created (which is newly defined in the dialog for new fields)
   */
  async openFieldConfig(field: ColumnConfig): Promise<string> {
    let fieldIdToEdit = toFormFieldConfig(field).id;
    const dialogRef = this.matDialog.open(AdminEntityFieldComponent, {
      width: "99%",
      maxHeight: "90vh",
      data: {
        fieldId: fieldIdToEdit,
        entityType: this.entityType,
      },
    });
    return lastValueFrom(dialogRef.afterClosed());
  }

  drop(event: CdkDragDrop<ColumnConfig[], ColumnConfig[]>) {
    const prevFieldsArray = event.previousContainer.data;
    const newFieldsArray = event.container.data;

    if (
      prevFieldsArray[event.previousIndex] === this.createNewFieldPlaceholder
    ) {
      this.dropNewField(event);
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(newFieldsArray, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        prevFieldsArray,
        newFieldsArray,
        event.previousIndex,
        event.currentIndex,
      );
    }

    if (newFieldsArray === this.availableFields) {
      // ensure available fields have consistent order
      this.initAvailableFields();
    }
  }

  /**
   * drop handler specifically for the "create new field" item
   * @param event
   * @private
   */
  private async dropNewField(
    event: CdkDragDrop<ColumnConfig[], ColumnConfig[]>,
  ) {
    if (event.container.data === this.availableFields) {
      // don't add new field to the available fields that are not in the form yet
      return;
    }

    const newFieldId = await this.openFieldConfig({ id: null });
    if (!newFieldId) {
      return;
    }

    this.dummyForm.addControl(newFieldId, new FormControl());
    this.dummyForm.disable();
    event.container.data.splice(event.currentIndex, 0, newFieldId);

    // the schema update has added the new field to the available fields already, remove it from there
    this.availableFields.splice(this.availableFields.indexOf(newFieldId), 1);
  }

  dropNewGroup(event: CdkDragDrop<any, any>) {
    const newCol = { fields: [] };
    this.config.fieldGroups.push(newCol);
    event.container.data = newCol.fields;
    this.drop(event);
  }

  removeGroup(i: number) {
    const [removedFieldGroup] = this.config.fieldGroups.splice(i, 1);
    this.initAvailableFields();
  }
}
