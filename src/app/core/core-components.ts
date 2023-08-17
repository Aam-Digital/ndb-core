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
        "./entity-components/entity-properties/edit/edit-age/edit-age.component"
      ).then((c) => c.EditAgeComponent),
  ],
  [
    "EditText",
    () =>
      import(
        "./entity-components/entity-properties/edit/edit-text/edit-text.component"
      ).then((c) => c.EditTextComponent),
  ],
  [
    "EditBoolean",
    () =>
      import(
        "./entity-components/entity-properties/edit/edit-boolean/edit-boolean.component"
      ).then((c) => c.EditBooleanComponent),
  ],
  [
    "EditDate",
    () =>
      import(
        "./entity-components/entity-properties/edit/edit-date/edit-date.component"
      ).then((c) => c.EditDateComponent),
  ],
  [
    "EditMonth",
    () =>
      import(
        "./entity-components/entity-properties/edit/edit-month/edit-month.component"
      ).then((c) => c.EditMonthComponent),
  ],
  [
    "EditLongText",
    () =>
      import(
        "./entity-components/entity-properties/edit/edit-long-text/edit-long-text.component"
      ).then((c) => c.EditLongTextComponent),
  ],
  [
    "EditPhoto",
    () =>
      import(
        "./entity-components/entity-properties/edit/edit-photo/edit-photo.component"
      ).then((c) => c.EditPhotoComponent),
  ],
  [
    "EditNumber",
    () =>
      import(
        "./entity-components/entity-properties/edit/edit-number/edit-number.component"
      ).then((c) => c.EditNumberComponent),
  ],
  [
    "EditDescriptionOnly",
    () =>
      import(
        "./entity-components/entity-properties/edit/edit-description-only/edit-description-only.component"
      ).then((c) => c.EditDescriptionOnlyComponent),
  ],
  [
    "DisplayCheckmark",
    () =>
      import(
        "./entity-components/entity-properties/view/display-checkmark/display-checkmark.component"
      ).then((c) => c.DisplayCheckmarkComponent),
  ],
  [
    "DisplayText",
    () =>
      import(
        "./entity-components/entity-properties/view/display-text/display-text.component"
      ).then((c) => c.DisplayTextComponent),
  ],
  [
    "DisplayDate",
    () =>
      import(
        "./entity-components/entity-properties/view/display-date/display-date.component"
      ).then((c) => c.DisplayDateComponent),
  ],
  [
    "DisplayMonth",
    () =>
      import(
        "./entity-components/entity-properties/view/display-month/display-month.component"
      ).then((c) => c.DisplayMonthComponent),
  ],
  [
    "ReadonlyFunction",
    () =>
      import(
        "./entity-components/entity-properties/view/readonly-function/readonly-function.component"
      ).then((c) => c.ReadonlyFunctionComponent),
  ],
  [
    "DisplayPercentage",
    () =>
      import(
        "./entity-components/entity-properties/view/display-percentage/display-percentage.component"
      ).then((c) => c.DisplayPercentageComponent),
  ],
  [
    "DisplayUnit",
    () =>
      import(
        "./entity-components/entity-properties/view/display-unit/display-unit.component"
      ).then((c) => c.DisplayUnitComponent),
  ],
  [
    "DisplayAge",
    () =>
      import(
        "./entity-components/entity-properties/view/display-age/display-age.component"
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
        "./entity-components/related-entities/related-entities.component"
      ).then((c) => c.RelatedEntitiesComponent),
  ],
  [
    "RelatedTimePeriodEntities",
    () =>
      import(
        "./entity-components/related-time-period-entities/related-time-period-entities.component"
      ).then((c) => c.RelatedTimePeriodEntitiesComponent),
  ],
];
