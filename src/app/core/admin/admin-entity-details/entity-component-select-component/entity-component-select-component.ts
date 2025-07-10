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
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  selector: "app-entity-component-select-component",
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    DialogCloseComponent,
    MatTooltipModule,
  ],
  templateUrl: "./entity-component-select-component.html",
  styleUrl: "./entity-component-select-component.scss",
})
export class EntityComponentSelectComponent {
  options: { label: string; value: PanelComponent; disabled?: boolean }[];

  constructor(
    private entityRelationsService: EntityRelationsService,
    private dialogRef: MatDialogRef<
      EntityComponentSelectComponent,
      PanelComponent
    >,
    @Inject(MAT_DIALOG_DATA) public data: { entityType: string },
  ) {
    const relatedEntityTypes =
      this.entityRelationsService.getEntityTypesReferencingType(
        this.data.entityType,
      );
    const hasRelatedEntities = relatedEntityTypes.length > 0;

    this.options = [
      {
        label: $localize`Form Fields Section`,
        value: {
          title: $localize`:Default title:New Section`,
          component: "Form",
          config: { fieldGroups: [] },
        },
      },
      {
        label: $localize`Related-Entity Section`,
        value: {
          title: $localize`:Default title:New Related Section`,
          component: "RelatedEntities",
          config: hasRelatedEntities
            ? { entityType: relatedEntityTypes[0].entityType.ENTITY_TYPE }
            : {},
        },
        disabled: !hasRelatedEntities,
      },
    ];
  }

  selectSectionType(opt: PanelComponent) {
    this.dialogRef.close(opt);
  }
}
