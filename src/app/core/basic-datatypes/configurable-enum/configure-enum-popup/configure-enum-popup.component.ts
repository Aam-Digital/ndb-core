import { Component, Inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { ConfigurableEnum } from "../configurable-enum";
import { NgForOf } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
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
import { Entity } from "../../../entity/model/entity";
import { OkButton } from "../../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { ConfigurableEnumValue } from "../configurable-enum.types";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-configure-enum-popup",
  templateUrl: "./configure-enum-popup.component.html",
  styleUrls: ["./configure-enum-popup.component.scss"],
  imports: [
    MatDialogModule,
    NgForOf,
    MatFormFieldModule,
    MatInputModule,
    DialogCloseComponent,
    FormsModule,
    CdkDropList,
    CdkDrag,
    FontAwesomeModule,
    MatButtonModule,
  ],
})
export class ConfigureEnumPopupComponent {
  newOptionInput: string;
  localValues: ConfigurableEnumValue[];
  private initialValues: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public enumEntity: ConfigurableEnum,
    private dialog: MatDialogRef<ConfigureEnumPopupComponent>,
    private entityMapper: EntityMapperService,
    private confirmationService: ConfirmationDialogService,
    private entities: EntityRegistry,
    private snackBar: MatSnackBar,
  ) {
    // Deep copy for editing
    this.localValues = enumEntity.values.map((v) => ({ ...v }));
    this.initialValues = JSON.stringify(this.localValues);
  }

  hasUnsavedChanges(): boolean {
    return JSON.stringify(this.localValues) !== this.initialValues;
  }

  private async confirmDiscardChanges(): Promise<boolean> {
    if (this.hasUnsavedChanges()) {
      const confirmed = await this.confirmationService.getConfirmation(
        $localize`Discard changes?`,
        $localize`You have unsaved changes. Discard them?`,
        [
          { text: $localize`Discard`, dialogResult: true, click() {} },
          { text: $localize`Cancel`, dialogResult: false, click() {} },
        ],
      );
      return !!confirmed;
    }
    return true;
  }

  async onSave() {
    // Copy localValues back to the original entity
    this.enumEntity.values = this.localValues.map((v) => ({ ...v }));
    await this.saveChanges();
    this.dialog.close(true);
  }

  async onCancel() {
    if (await this.confirmDiscardChanges()) {
      this.dialog.close(false);
    }
    // else do nothing, stay open
  }

  private async saveChanges() {
    await this.entityMapper.save(this.enumEntity);
    this.initialValues = JSON.stringify(this.localValues);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.localValues, event.previousIndex, event.currentIndex);
  }

  async delete(value: ConfigurableEnumValue, index: number) {
    const existingUsages = await this.getUsages(value);
    let deletionText = $localize`Are you sure that you want to delete the option "${value.label}"?`;
    if (existingUsages.length > 0) {
      deletionText += $localize` The option is still used in ${existingUsages.join(
        ", ",
      )} records. If deleted, the records will not be lost but specially marked.`;
    }
    const confirmed = await this.confirmationService.getConfirmation(
      $localize`Delete option`,
      deletionText,
    );
    if (confirmed) {
      this.localValues.splice(index, 1);
    }
  }

  private async getUsages(value: ConfigurableEnumValue) {
    const enumMap: { [key in string]: string[] } = {};
    for (const entity of this.entities.values()) {
      const schemaFields = [...entity.schema.entries()]
        .filter(
          ([_, schema]) => schema.additional === this.enumEntity.getId(true),
        )
        .map(([name]) => name);
      if (schemaFields.length > 0) {
        enumMap[entity.ENTITY_TYPE] = schemaFields;
      }
    }
    const entityPromises = Object.entries(enumMap).map(([entityType, props]) =>
      this.entityMapper
        .loadType(entityType)
        .then((entities) => this.getEntitiesWithValue(entities, props, value)),
    );
    const possibleEntities = await Promise.all(entityPromises);
    return possibleEntities
      .filter((entities) => entities.length > 0)
      .map(
        (entities) =>
          `${entities.length} ${entities[0].getConstructor().label}`,
      );
  }

  private getEntitiesWithValue(
    res: Entity[],
    props: string[],
    value: ConfigurableEnumValue,
  ) {
    return res.filter((entity) =>
      props.some(
        (prop) =>
          entity[prop]?.id === value?.id ||
          entity[prop]?.map?.((v) => v.id).includes(value.id),
      ),
    );
  }

  // Multi-line paste handler for adding new options
  onPasteNewOption(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData("text");
    const lines = pastedText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line);

    if (lines.length > 1) {
      event.preventDefault();
      this.newOptionInput = lines.join("\n");
    }
  }

  async createNewOption() {
    if (!this.newOptionInput || !this.newOptionInput.trim()) return;

    const lines = this.newOptionInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line);

    const existingLabels = this.localValues.map((v) =>
      v.label.trim().toLowerCase(),
    );
    let skipped = 0;

    for (const line of lines) {
      if (existingLabels.includes(line.toLowerCase())) {
        skipped++;
        continue;
      }
      try {
        // Use the same structure as enum values
        this.localValues.push({
          id: line.toUpperCase(),
          label: line,
        });
        existingLabels.push(line.toLowerCase());
      } catch (err) {
        console.error("Failed to add option:", line, err);
      }
    }

    this.newOptionInput = "";

    if (skipped > 0) {
      this.snackBar.open(
        $localize`:@@duplicateOptionsSkipped:Skipped ${skipped} duplicate entr${skipped === 1 ? "y" : "ies"}.`,
        undefined,
        { duration: 3000 },
      );
    }
  }
}
