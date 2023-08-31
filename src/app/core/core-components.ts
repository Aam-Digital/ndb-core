import { ComponentTuple } from "../dynamic-components";

export const coreComponents: ComponentTuple[] = [
  [
    "DisplayConfigurableEnum",
    () =>
      import(
        "./basic-datatypes/configurable-enum/display-configurable-enum/display-configurable-enum.component"
      ).then((c) => c.DisplayConfigurableEnumComponent),
  ],
  [
    "EditConfigurableEnum",
    () =>
      import(
        "./basic-datatypes/configurable-enum/edit-configurable-enum/edit-configurable-enum.component"
      ).then((c) => c.EditConfigurableEnumComponent),
  ],
  [
    "Form",
    () =>
      import("./entity-details/form/form.component").then(
        (c) => c.FormComponent,
      ),
  ],
  [
    "EditEntityArray",
    () =>
      import(
        "./basic-datatypes/entity-array/edit-entity-array/edit-entity-array.component"
      ).then((c) => c.EditEntityArrayComponent),
  ],
  [
    "EditSingleEntity",
    () =>
      import(
        "./basic-datatypes/entity/edit-single-entity/edit-single-entity.component"
      ).then((c) => c.EditSingleEntityComponent),
  ],
  [
    "DisplayEntityArray",
    () =>
      import(
        "./basic-datatypes/entity-array/display-entity-array/display-entity-array.component"
      ).then((c) => c.DisplayEntityArrayComponent),
  ],
  [
    "EditTextWithAutocomplete",
    () =>
      import(
        "./common-components/edit-text-with-autocomplete/edit-text-with-autocomplete.component"
      ).then((c) => c.EditTextWithAutocompleteComponent),
  ],
  [
    "EditAge",
    () =>
      import(
        "./basic-datatypes/date-with-age/edit-age/edit-age.component"
      ).then((c) => c.EditAgeComponent),
  ],
  [
    "EditText",
    () =>
      import("./basic-datatypes/string/edit-text/edit-text.component").then(
        (c) => c.EditTextComponent,
      ),
  ],
  [
    "EditBoolean",
    () =>
      import(
        "./basic-datatypes/boolean/edit-boolean/edit-boolean.component"
      ).then((c) => c.EditBooleanComponent),
  ],
  [
    "EditDate",
    () =>
      import("./basic-datatypes/date/edit-date/edit-date.component").then(
        (c) => c.EditDateComponent,
      ),
  ],
  [
    "EditMonth",
    () =>
      import("./basic-datatypes/month/edit-month/edit-month.component").then(
        (c) => c.EditMonthComponent,
      ),
  ],
  [
    "EditLongText",
    () =>
      import(
        "./basic-datatypes/string/edit-long-text/edit-long-text.component"
      ).then((c) => c.EditLongTextComponent),
  ],
  [
    "EditPhoto",
    () =>
      import("../features/file/edit-photo/edit-photo.component").then(
        (c) => c.EditPhotoComponent,
      ),
  ],
  [
    "EditNumber",
    () =>
      import("./basic-datatypes/number/edit-number/edit-number.component").then(
        (c) => c.EditNumberComponent,
      ),
  ],
  [
    "EditDescriptionOnly",
    () =>
      import(
        "./common-components/description-only/edit-description-only/edit-description-only.component"
      ).then((c) => c.EditDescriptionOnlyComponent),
  ],
  [
    "DisplayCheckmark",
    () =>
      import(
        "./basic-datatypes/boolean/display-checkmark/display-checkmark.component"
      ).then((c) => c.DisplayCheckmarkComponent),
  ],
  [
    "DisplayText",
    () =>
      import(
        "./basic-datatypes/string/display-text/display-text.component"
      ).then((c) => c.DisplayTextComponent),
  ],
  [
    "DisplayDate",
    () =>
      import("./basic-datatypes/date/display-date/display-date.component").then(
        (c) => c.DisplayDateComponent,
      ),
  ],
  [
    "DisplayMonth",
    () =>
      import(
        "./basic-datatypes/month/display-month/display-month.component"
      ).then((c) => c.DisplayMonthComponent),
  ],
  [
    "ReadonlyFunction",
    () =>
      import(
        "./common-components/display-readonly-function/readonly-function.component"
      ).then((c) => c.ReadonlyFunctionComponent),
  ],
  [
    "DisplayPercentage",
    () =>
      import(
        "./basic-datatypes/number/display-percentage/display-percentage.component"
      ).then((c) => c.DisplayPercentageComponent),
  ],
  [
    "DisplayUnit",
    () =>
      import(
        "./basic-datatypes/number/display-unit/display-unit.component"
      ).then((c) => c.DisplayUnitComponent),
  ],
  [
    "DisplayAge",
    () =>
      import(
        "./basic-datatypes/date-with-age/display-age/display-age.component"
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
      import("./entity-list/entity-list/entity-list.component").then(
        (c) => c.EntityListComponent,
      ),
  ],
  [
    "EntityDetails",
    () =>
      import("./entity-details/entity-details/entity-details.component").then(
        (c) => c.EntityDetailsComponent,
      ),
  ],
  [
    "DisplayEntity",
    () =>
      import(
        "./basic-datatypes/entity/display-entity/display-entity.component"
      ).then((c) => c.DisplayEntityComponent),
  ],
  [
    "RelatedEntities",
    () =>
      import(
        "./entity-details/related-entities/related-entities.component"
      ).then((c) => c.RelatedEntitiesComponent),
  ],
  [
    "RelatedTimePeriodEntities",
    () =>
      import(
        "./entity-details/related-time-period-entities/related-time-period-entities.component"
      ).then((c) => c.RelatedTimePeriodEntitiesComponent),
  ],
];
