import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { PanelComponent } from "#src/app/core/entity-details/EntityDetailsConfig";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { Component, Inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";

@Component({
  selector: "app-entity-component-select-component",
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    DialogCloseComponent,
  ],
  templateUrl: "./entity-component-select-component.html",
  styleUrl: "./entity-component-select-component.scss",
})
export class EntityComponentSelectComponent {
  options: { label: string; value: PanelComponent }[];

  constructor(
    private entityRelationsService: EntityRelationsService,
    private dialogRef: MatDialogRef<
      EntityComponentSelectComponent,
      PanelComponent
    >,
    @Inject(MAT_DIALOG_DATA) public data: { entityType: string },
  ) {
    this.options = [
      {
        label: $localize`Form Fields Section`,
        value: {
          title: $localize`:Default title:New Section`,
          component: "Form", // TODO: make this configurable
          config: { fieldGroups: [] },
        },
      },
      {
        label: $localize`Related-Entity Section`,
        value: {
          title: $localize`:Default title:New Related Section`,
          component: "RelatedEntities",
          config: {},
        },
      },
    ];
  }

  selectSectionType(opt: PanelComponent) {
    // Preselect the first available related-entity type by default for RelatedEntities
    if (opt.component === "RelatedEntities") {
      const availableEntityTypes = this.entityRelationsService
        .getEntityTypesReferencingType(this.data.entityType)
        .map((refType) => ({
          entityType: refType.entityType.ENTITY_TYPE,
        }));

      if (availableEntityTypes.length > 0) {
        opt.config.entityType = availableEntityTypes[0].entityType;
      }
    }
    this.dialogRef.close(opt);
  }
}
