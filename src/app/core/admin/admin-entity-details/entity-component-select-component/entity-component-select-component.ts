import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { PanelComponent } from "#src/app/core/entity-details/EntityDetailsConfig";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { Component, Inject, OnInit } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * Admin component to select components to be added to view configs.
 */
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
export class EntityComponentSelectComponent implements OnInit {
  options: WidgetOption[];

  constructor(
    private entityRelationsService: EntityRelationsService,
    private dialogRef: MatDialogRef<
      EntityComponentSelectComponent,
      PanelComponent
    >,
    @Inject(MAT_DIALOG_DATA) public data: { entityType: string },
  ) {}

  ngOnInit() {
    this.options = this.loadAvailableWidgets();
  }

  private loadAvailableWidgets(): WidgetOption[] {
    const relatedEntityTypes =
      this.entityRelationsService.getEntityTypesReferencingType(
        this.data.entityType,
      );
    const hasRelatedEntities = relatedEntityTypes?.length > 0;

    return [
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
        disabled: !hasRelatedEntities
          ? $localize`Add a field with type that links to this record to enable this section.`
          : undefined,
      },
    ];
  }

  selectSectionType(opt: PanelComponent) {
    this.dialogRef.close(opt);
  }
}

export interface WidgetOption {
  label: string;
  value: PanelComponent;

  /**
   * If the option is not available in the current context, mark it as disabled
   * by providing any string value describing the reason (displayed as tooltip).
   */
  disabled?: string;
}
