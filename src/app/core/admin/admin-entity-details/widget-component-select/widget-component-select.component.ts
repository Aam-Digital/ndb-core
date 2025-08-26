import { v4 as uuid } from "uuid";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { PanelComponent } from "#src/app/core/entity-details/EntityDetailsConfig";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { Component, OnInit, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DynamicComponentConfig } from "#src/app/core/config/dynamic-components/dynamic-component-config.interface";
import { DashboardWidgetRegistryService } from "#src/app/core/dashboard/dashboard-widget-registry.service";

/**
 * Admin component to select components to be added to view configs or dashboard.
 */
@Component({
  selector: "app-widget-component-select",
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    DialogCloseComponent,
    MatTooltipModule,
  ],
  templateUrl: "./widget-component-select.component.html",
  styleUrl: "./widget-component-select.component.scss",
})
export class WidgetComponentSelectComponent implements OnInit {
  private entityRelationsService = inject(EntityRelationsService);
  private dialogRef =
    inject<MatDialogRef<WidgetComponentSelectComponent, any>>(MatDialogRef);
  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);

  data = inject<{
    entityType?: string;
    isDashboard?: boolean;
  }>(MAT_DIALOG_DATA);

  options: WidgetOption[]

  ngOnInit() {
    if (this.data.isDashboard) {
      this.options = this.widgetRegistry.getAvailableWidgets();
    } else {
      this.options = this.loadAvailableWidgets();
    }
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

  selectSectionType(opt: PanelComponent | DynamicComponentConfig) {
    this.dialogRef.close(opt);
  }
}

export interface WidgetOption {
  label: string;
  value: PanelComponent | DynamicComponentConfig;

  /**
   * If the option is not available in the current context, mark it as disabled
   * by providing any string value describing the reason (displayed as tooltip).
   */
  disabled?: string;
}
