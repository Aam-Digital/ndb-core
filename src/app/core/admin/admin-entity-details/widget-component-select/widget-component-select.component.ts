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

  data = inject<{
    entityType?: string;
    isDashboard?: boolean;
  }>(MAT_DIALOG_DATA);

  options: WidgetOption[] | DashboardWidgetOption[];

  ngOnInit() {
    if (this.data.isDashboard) {
      this.options = this.loadDashboardWidgets();
    } else {
      this.options = this.loadAvailableWidgets();
    }
  }

  private loadDashboardWidgets(): DashboardWidgetOption[] {
    return [
      {
        label: $localize`Shortcuts`,
        value: {
          component: "ShortcutDashboard",
          config: {
            shortcuts: [
              {
                label: "Record Attendance",
                icon: "calendar-check",
                link: "/attendance/add-day",
              },
              {
                label: "Add Child",
                icon: "plus",
                link: "/child/new",
              },
              {
                label: "Public Registration Form",
                icon: "file-circle-check",
                link: "/public-form/form/test",
              },
            ],
          },
        },
      },
      {
        label: $localize`Entity Count`,
        value: {
          component: "EntityCountDashboard",
          config: {},
        },
      },
      {
        label: $localize`Important Notes`,
        value: {
          component: "ImportantNotesDashboard",
          config: { warningLevels: ["WARNING", "URGENT"] },
        },
      },
      {
        label: $localize`Todos`,
        value: {
          component: "TodosDashboard",
          config: {},
        },
      },
      {
        label: $localize`Notes`,
        value: {
          component: "NotesDashboard",
          config: {
            sinceDays: 28,
            fromBeginningOfWeek: false,
            mode: "with-recent-notes",
          },
        },
      },
      {
        label: $localize`Attendance (recent absences)`,
        value: {
          component: "AttendanceWeekDashboard",
          config: { daysOffset: 7, periodLabel: "this week" },
        },
      },
      {
        label: $localize`Progress`,
        value: {
          component: "ProgressDashboard",
          config: { dashboardConfigId: "1" },
        },
      },
      {
        label: $localize`Birthdays`,
        value: {
          component: "BirthdayDashboard",
          config: { entities: { Child: "dateOfBirth", School: "dateOfBirth" } },
        },
      },
    ];
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

  selectSectionType(opt: any) {
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

export interface DashboardWidgetOption {
  label: string;
  value: DynamicComponentConfig;
  disabled?: string;
}
