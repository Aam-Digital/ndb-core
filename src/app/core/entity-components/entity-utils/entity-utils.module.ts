import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EditTextComponent } from "./dynamic-form-components/edit-text/edit-text.component";
import { EditDateComponent } from "./dynamic-form-components/edit-date/edit-date.component";
import { EditAgeComponent } from "./dynamic-form-components/edit-age/edit-age.component";
import { EditBooleanComponent } from "./dynamic-form-components/edit-boolean/edit-boolean.component";
import { EditLongTextComponent } from "./dynamic-form-components/edit-long-text/edit-long-text.component";
import { EditPhotoComponent } from "./dynamic-form-components/edit-photo/edit-photo.component";
import { DisplayTextComponent } from "./view-components/display-text/display-text.component";
import { DisplayDateComponent } from "./view-components/display-date/display-date.component";
import { DisplayCheckmarkComponent } from "./view-components/display-checkmark/display-checkmark.component";
import { ReadonlyFunctionComponent } from "./view-components/readonly-function/readonly-function.component";
import { DisplayPercentageComponent } from "./view-components/display-percentage/display-percentage.component";
import { DisplayUnitComponent } from "./view-components/display-unit/display-unit.component";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { ReactiveFormsModule } from "@angular/forms";
import { ConfigurableEnumModule } from "../../configurable-enum/configurable-enum.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { ViewModule } from "../../view/view.module";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EditNumberComponent } from "./dynamic-form-components/edit-number/edit-number.component";
import { EntityFunctionPipe } from "./view-components/readonly-function/entity-function.pipe";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { ErrorHintComponent } from "./error-hint/error-hint.component";
import { DisplayAgeComponent } from "./view-components/display-age/display-age.component";
import { EntityPropertyViewComponent } from "./entity-property-view/entity-property-view.component";

@NgModule({
  declarations: [
    EditTextComponent,
    EditDateComponent,
    EditAgeComponent,
    EditBooleanComponent,
    EditLongTextComponent,
    EditPhotoComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayCheckmarkComponent,
    ReadonlyFunctionComponent,
    DisplayPercentageComponent,
    DisplayUnitComponent,
    EditNumberComponent,
    EntityFunctionPipe,
    ErrorHintComponent,
    DisplayAgeComponent,
    EntityPropertyViewComponent,
  ],
  imports: [
    CommonModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
    ConfigurableEnumModule,
    MatTooltipModule,
    MatInputModule,
    ViewModule,
    MatDatepickerModule,
    MatCheckboxModule,
    FontAwesomeModule,
    MatButtonModule,
  ],
  exports: [EntityPropertyViewComponent, ReadonlyFunctionComponent],
})
export class EntityUtilsModule {
  static dynamicComponents = [
    EditAgeComponent,
    EditBooleanComponent,
    EditLongTextComponent,
    EditNumberComponent,
    EditPhotoComponent,
    EditTextComponent,
    EditDateComponent,
    DisplayCheckmarkComponent,
    DisplayDateComponent,
    DisplayPercentageComponent,
    DisplayTextComponent,
    DisplayUnitComponent,
    DisplayAgeComponent,
    ReadonlyFunctionComponent,
  ];
}
