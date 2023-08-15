import { ComponentTuple } from "../dynamic-components";

export const coreComponents: ComponentTuple[] = [
  [
    "DisplayConfigurableEnum",
    () =>
      import(
        "./configurable-enum/display-configurable-enum/display-configurable-enum.component"
      ).then((c) => c.DisplayConfigurableEnumComponent),
  ],
  [
    "EditConfigurableEnum",
    () =>
      import(
        "./configurable-enum/edit-configurable-enum/edit-configurable-enum.component"
      ).then((c) => c.EditConfigurableEnumComponent),
  ],
  [
    "DashboardShortcutWidget",
    () =>
      import(
        "./dashboard-shortcut-widget/dashboard-shortcut-widget/dashboard-shortcut-widget.component"
      ).then((c) => c.DashboardShortcutWidgetComponent),
  ],
  [
    "Form",
    () =>
      import("./entity-components/entity-details/form/form.component").then(
        (c) => c.FormComponent,
      ),
  ],
  [
    "EditEntityArray",
    () =>
      import(
        "./entity-components/entity-select/edit-entity-array/edit-entity-array.component"
      ).then((c) => c.EditEntityArrayComponent),
  ],
  [
    "EditSingleEntity",
    () =>
      import(
        "./entity-components/entity-select/edit-single-entity/edit-single-entity.component"
      ).then((c) => c.EditSingleEntityComponent),
  ],
  [
    "DisplayEntityArray",
    () =>
      import(
        "./entity-components/entity-select/display-entity-array/display-entity-array.component"
      ).then((c) => c.DisplayEntityArrayComponent),
  ],
  [
    "EditTextWithAutocomplete",
    () =>
      import(
        "./entity-components/entity-select/edit-text-with-autocomplete/edit-text-with-autocomplete.component"
      ).then((c) => c.EditTextWithAutocompleteComponent),
  ],
  [
    "EditAge",
    () =>
      import(
        "./entity-components/entity-utils/dynamic-form-components/edit-age/edit-age.component"
      ).then((c) => c.EditAgeComponent),
  ],
  [
    "EditText",
    () =>
      import(
        "./entity-components/entity-utils/dynamic-form-components/edit-text/edit-text.component"
      ).then((c) => c.EditTextComponent),
  ],
  [
    "EditBoolean",
    () =>
      import(
        "./entity-components/entity-utils/dynamic-form-components/edit-boolean/edit-boolean.component"
      ).then((c) => c.EditBooleanComponent),
  ],
  [
    "EditDate",
    () =>
      import(
        "./entity-components/entity-utils/dynamic-form-components/edit-date/edit-date.component"
      ).then((c) => c.EditDateComponent),
  ],
  [
    "EditMonth",
    () =>
      import(
        "./entity-components/entity-utils/dynamic-form-components/edit-month/edit-month.component"
      ).then((c) => c.EditMonthComponent),
  ],
  [
    "EditLongText",
    () =>
      import(
        "./entity-components/entity-utils/dynamic-form-components/edit-long-text/edit-long-text.component"
      ).then((c) => c.EditLongTextComponent),
  ],
  [
    "EditPhoto",
    () =>
      import(
        "./entity-components/entity-utils/dynamic-form-components/edit-photo/edit-photo.component"
      ).then((c) => c.EditPhotoComponent),
  ],
  [
    "EditNumber",
    () =>
      import(
        "./entity-components/entity-utils/dynamic-form-components/edit-number/edit-number.component"
      ).then((c) => c.EditNumberComponent),
  ],
  [
    "EditDescriptionOnly",
    () =>
      import(
        "./entity-components/entity-utils/dynamic-form-components/edit-description-only/edit-description-only.component"
      ).then((c) => c.EditDescriptionOnlyComponent),
  ],
  [
    "DisplayCheckmark",
    () =>
      import(
        "./entity-components/entity-utils/view-components/display-checkmark/display-checkmark.component"
      ).then((c) => c.DisplayCheckmarkComponent),
  ],
  [
    "DisplayText",
    () =>
      import(
        "./entity-components/entity-utils/view-components/display-text/display-text.component"
      ).then((c) => c.DisplayTextComponent),
  ],
  [
    "DisplayDate",
    () =>
      import(
        "./entity-components/entity-utils/view-components/display-date/display-date.component"
      ).then((c) => c.DisplayDateComponent),
  ],
  [
    "DisplayMonth",
    () =>
      import(
        "./entity-components/entity-utils/view-components/display-month/display-month.component"
      ).then((c) => c.DisplayMonthComponent),
  ],
  [
    "ReadonlyFunction",
    () =>
      import(
        "./entity-components/entity-utils/view-components/readonly-function/readonly-function.component"
      ).then((c) => c.ReadonlyFunctionComponent),
  ],
  [
    "DisplayPercentage",
    () =>
      import(
        "./entity-components/entity-utils/view-components/display-percentage/display-percentage.component"
      ).then((c) => c.DisplayPercentageComponent),
  ],
  [
    "DisplayUnit",
    () =>
      import(
        "./entity-components/entity-utils/view-components/display-unit/display-unit.component"
      ).then((c) => c.DisplayUnitComponent),
  ],
  [
    "DisplayAge",
    () =>
      import(
        "./entity-components/entity-utils/view-components/display-age/display-age.component"
      ).then((c) => c.DisplayAgeComponent),
  ],
  [
    "UserSecurity",
    () =>
      import("./user/user-security/user-security.component").then(
        (c) => c.UserSecurityComponent,
      ),
  ],
  [
    "Dashboard",
    () =>
      import("./dashboard/dashboard/dashboard.component").then(
        (c) => c.DashboardComponent,
      ),
  ],
  [
    "EntityList",
    () =>
      import("./entity-components/entity-list/entity-list.component").then(
        (c) => c.EntityListComponent,
      ),
  ],
  [
    "EntityDetails",
    () =>
      import(
        "./entity-components/entity-details/entity-details.component"
      ).then((c) => c.EntityDetailsComponent),
  ],
  [
    "Admin",
    () => import("./admin/admin/admin.component").then((c) => c.AdminComponent),
  ],
  [
    "ConfigImport",
    () =>
      import("./config-setup/config-import/config-import.component").then(
        (c) => c.ConfigImportComponent,
      ),
  ],
  [
    "MarkdownPage",
    () =>
      import("./markdown-page/markdown-page/markdown-page.component").then(
        (c) => c.MarkdownPageComponent,
      ),
  ],
  [
    "DisplayEntity",
    () =>
      import(
        "./entity-components/entity-select/display-entity/display-entity.component"
      ).then((c) => c.DisplayEntityComponent),
  ],
  [
    "RelatedEntities",
    () =>
      import(
        "./entity-components/entity-details/related-entities/related-entities.component"
      ).then((c) => c.RelatedEntitiesComponent),
  ],
  [
    "PreviousRelations",
    () =>
      import(
        "./entity-components/previous-relations/previous-relations.component"
      ).then((c) => c.PreviousRelationsComponent),
  ],
];
