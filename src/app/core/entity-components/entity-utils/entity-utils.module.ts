import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EditConfigurableEnumComponent } from "./dynamic-form-components/edit-configurable-enum/edit-configurable-enum.component";
import { EditTextComponent } from "./dynamic-form-components/edit-text/edit-text.component";
import { EditDateComponent } from "./dynamic-form-components/edit-date/edit-date.component";
import { EditSelectableComponent } from "./dynamic-form-components/edit-selectable/edit-selectable.component";
import { EditAgeComponent } from "./dynamic-form-components/edit-age/edit-age.component";
import { EditBooleanComponent } from "./dynamic-form-components/edit-boolean/edit-boolean.component";
import { EditLongTextComponent } from "./dynamic-form-components/edit-long-text/edit-long-text.component";
import { EditPhotoComponent } from "./dynamic-form-components/edit-photo/edit-photo.component";
import { EditEntityArrayComponent } from "./dynamic-form-components/edit-entity-array/edit-entity-array.component";
import { EditSingleEntityComponent } from "./dynamic-form-components/edit-single-entity/edit-single-entity.component";
import { EditPercentageComponent } from "./dynamic-form-components/edit-percentage/edit-percentage.component";
import { DisplayEntityComponent } from "./view-components/display-entity/display-entity.component";
import { DisplayEntityArrayComponent } from "./view-components/display-entity-array/display-entity-array.component";
import { DisplayTextComponent } from "./view-components/display-text/display-text.component";
import { DisplayDateComponent } from "./view-components/display-date/display-date.component";
import { DisplayConfigurableEnumComponent } from "./view-components/display-configurable-enum/display-configurable-enum.component";
import { DisplayCheckmarkComponent } from "./view-components/display-checkmark/display-checkmark.component";
import { ReadonlyFunctionComponent } from "./view-components/readonly-function/readonly-function.component";
import { DisplayPercentageComponent } from "./view-components/display-percentage/display-percentage.component";
import { DisplayUnitComponent } from "./view-components/display-unit/display-unit.component";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { ReactiveFormsModule } from "@angular/forms";
import { ConfigurableEnumModule } from "../../configurable-enum/configurable-enum.module";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { ViewModule } from "../../view/view.module";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EntitySelectComponent } from "./entity-select/entity-select.component";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatChipsModule } from "@angular/material/chips";

@NgModule({
  declarations: [
    EditConfigurableEnumComponent,
    EditTextComponent,
    EditDateComponent,
    EditSelectableComponent,
    EditAgeComponent,
    EditBooleanComponent,
    EditLongTextComponent,
    EditPhotoComponent,
    EditEntityArrayComponent,
    EditSingleEntityComponent,
    EditPercentageComponent,
    DisplayEntityComponent,
    DisplayEntityArrayComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayConfigurableEnumComponent,
    DisplayCheckmarkComponent,
    ReadonlyFunctionComponent,
    DisplayPercentageComponent,
    DisplayUnitComponent,
    EntitySelectComponent,
  ],
  imports: [
    CommonModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
    ConfigurableEnumModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    ViewModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatChipsModule,
  ],
  entryComponents: [
    EditConfigurableEnumComponent,
    EditTextComponent,
    EditDateComponent,
    EditSelectableComponent,
    EditAgeComponent,
    EditBooleanComponent,
    EditLongTextComponent,
    EditPhotoComponent,
    EditEntityArrayComponent,
    EditSingleEntityComponent,
    EditPercentageComponent,
    DisplayEntityComponent,
    DisplayEntityArrayComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayConfigurableEnumComponent,
    DisplayCheckmarkComponent,
    ReadonlyFunctionComponent,
    DisplayPercentageComponent,
    DisplayUnitComponent,
  ],
  exports: [DisplayEntityComponent, EntitySelectComponent],
})
export class EntityUtilsModule {}
