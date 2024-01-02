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
import { ConfigurableEnumValue } from "../configurable-enum.interface";
import { MatButtonModule } from "@angular/material/button";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { Entity } from "../../../entity/model/entity";

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
  standalone: true,
})
export class ConfigureEnumPopupComponent {
  newOptionInput: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public enumEntity: ConfigurableEnum,
    private dialog: MatDialogRef<ConfigureEnumPopupComponent>,
    private entityMapper: EntityMapperService,
    private confirmationService: ConfirmationDialogService,
    private entities: EntityRegistry,
  ) {
    const initialValues = JSON.stringify(enumEntity.values);
    this.dialog.afterClosed().subscribe(() => {
      if (JSON.stringify(this.enumEntity.values) !== initialValues) {
        this.entityMapper.save(this.enumEntity);
      }
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.enumEntity.values,
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
    );
    if (confirmed) {
      this.enumEntity.values.splice(index, 1);
      await this.entityMapper.save(this.enumEntity);
    }
  }

  private async getUsages(value: ConfigurableEnumValue) {
    const enumMap: { [key in string]: string[] } = {};
    for (const entity of this.entities.values()) {
      // TODO should this be migrated?
      const schemaFields = [...entity.schema.entries()]
        .filter(
          ([_, schema]) =>
            schema.innerDataType === this.enumEntity.getId() ||
            schema.additional === this.enumEntity.getId(),
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

  createNewOption() {
    this.enumEntity.values.push({
      id: this.newOptionInput,
      label: this.newOptionInput,
    });
    this.newOptionInput = "";
  }
}
