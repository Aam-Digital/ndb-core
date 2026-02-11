import { Component, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import {
  ConfigurableEnum,
  DuplicateEnumOptionException,
} from "../configurable-enum";
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
import { ConfigurableEnumValue } from "../configurable-enum.types";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  CustomYesNoButtons,
  YesNoButtons,
} from "../../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ColorInputComponent } from "#src/app/core/common-components/color-input/color-input.component";

@Component({
  selector: "app-configure-enum-popup",
  templateUrl: "./configure-enum-popup.component.html",
  styleUrls: ["./configure-enum-popup.component.scss"],
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    DialogCloseComponent,
    FormsModule,
    CdkDropList,
    CdkDrag,
    FontAwesomeModule,
    MatButtonModule,
    MatTooltipModule,
    ColorInputComponent,
  ],
})
export class ConfigureEnumPopupComponent {
  enumEntity = inject<ConfigurableEnum>(MAT_DIALOG_DATA);
  private dialog =
    inject<MatDialogRef<ConfigureEnumPopupComponent>>(MatDialogRef);
  private entityMapper = inject(EntityMapperService);
  private confirmationService = inject(ConfirmationDialogService);
  private entities = inject(EntityRegistry);
  private snackBar = inject(MatSnackBar);

  newOptionInput: string;
  localEnum: ConfigurableEnum;

  constructor() {
    // disable closing with backdrop click (so that we can always confirm unsaved changes)
    this.dialog.disableClose = true;

    // Deep copy for editing, using ConfigurableEnum logic
    this.localEnum = new ConfigurableEnum(
      this.enumEntity.getId(),
      this.enumEntity.values.map((v) => ({ ...v })),
    );
  }

  hasUnsavedChanges(): boolean {
    return (
      JSON.stringify(this.localEnum.values) !==
      JSON.stringify(this.enumEntity.values)
    );
  }

  private async confirmDiscardChanges(): Promise<boolean> {
    if (!this.hasUnsavedChanges()) return true;
    const confirmed = await this.confirmationService.getConfirmation(
      $localize`Discard changes?`,
      $localize`You have unsaved changes. Discard them?`,
      CustomYesNoButtons($localize`Discard`, $localize`Continue Editing`),
    );
    return confirmed === true;
  }

  private async confirmAddPendingOption(): Promise<boolean> {
    if (!this.hasValidInput()) return true;
    const confirmed = await this.confirmationService.getConfirmation(
      $localize`Add new option?`,
      $localize`You have a new option that is not added yet, do you want to add it?`,
      YesNoButtons,
    );
    return confirmed === true;
  }

  private async confirmCommaSplit(): Promise<boolean> {
    const confirmed = await this.confirmationService.getConfirmation(
      $localize`Split by commas?`,
      $localize`Do you want to split the text by commas and add multiple options?`,
      YesNoButtons,
    );
    return confirmed === true;
  }

  private splitByLine(input: string): string[] {
    return input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line);
  }

  private splitByComma(input: string): string[] {
    return input
      .split(",")
      .map((line) => line.trim())
      .filter((line) => line);
  }

  private async parseInputLines(input: string): Promise<string[]> {
    if (input.includes("\n")) {
      return this.splitByLine(input);
    }
    if (input.includes(",")) {
      return (await this.confirmCommaSplit())
        ? this.splitByComma(input)
        : [input];
    }
    return [input];
  }

  private async handlePendingNewOption(): Promise<boolean> {
    const confirmed = await this.confirmAddPendingOption();
    if (confirmed) {
      await this.createNewOption();
      return true;
    } else {
      this.newOptionInput = "";
      return true;
    }
  }

  async onSave() {
    if (!(await this.handlePendingNewOption())) return;
    this.enumEntity.values = this.localEnum.values.map((v) => ({ ...v }));
    await this.saveChanges();
    this.dialog.close(true);
  }

  async onCancel() {
    if (!(await this.handlePendingNewOption())) return;
    if (await this.confirmDiscardChanges()) {
      this.dialog.close(false);
    }
  }

  private async saveChanges() {
    await this.entityMapper.save(this.enumEntity);
  }

  drop(event: CdkDragDrop<string[]>) {
    // TODO: this should probably update the _ordinal to allow sorting by custom order in tables (https://github.com/Aam-Digital/ndb-core/issues/3655)
    moveItemInArray(
      this.localEnum.values,
      event.previousIndex,
      event.currentIndex,
    );
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
      CustomYesNoButtons($localize`Delete`, $localize`Cancel`),
    );
    if (confirmed === true) {
      this.localEnum.values.splice(index, 1);
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

  onPasteNewOption(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData("text");
    const lines = this.splitByLine(pastedText).filter(
      (l) => !!l && l.trim() !== "",
    );

    event.preventDefault();
    this.newOptionInput = lines.join("\n");
  }

  async createNewOption() {
    if (!this.hasValidInput()) return;

    const input = this.newOptionInput.trim();
    const lines = await this.parseInputLines(input);

    let skipped = 0;
    for (const line of lines) {
      try {
        this.localEnum.addOption(line);
      } catch (err) {
        if (err instanceof DuplicateEnumOptionException) {
          skipped++;
        } else {
          console.error("Failed to add option:", line, err);
        }
      }
    }

    this.newOptionInput = "";

    if (skipped > 0) {
      this.showDuplicateSkippedMessage(skipped);
    }
  }

  private hasValidInput(): boolean {
    return !!this.newOptionInput && !!this.newOptionInput.trim();
  }

  private showDuplicateSkippedMessage(skipped: number) {
    this.snackBar.open(
      $localize`:@@duplicateOptionsSkipped:Skipped ${skipped} duplicate entr${skipped === 1 ? "y" : "ies"}.`,
      undefined,
      { duration: 3000 },
    );
  }
}
