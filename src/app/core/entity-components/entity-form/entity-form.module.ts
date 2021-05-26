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
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { ConfigurableEnumModule } from "../../configurable-enum/configurable-enum.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatIconModule } from "@angular/material/icon";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatInputModule } from "@angular/material/input";
import { MatNativeDateModule } from "@angular/material/core";
import { AlertsModule } from "../../alerts/alerts.module";
import { EditEntityArrayComponent } from "./dynamic-form-components/edit-entity-array/edit-entity-array.component";
import { EntitySelectModule } from "../entity-select/entity-select.module";
import { EditSingleEntityComponent } from "./dynamic-form-components/edit-single-entity/edit-single-entity.component";
import { EditPercentageComponent } from "./dynamic-form-components/edit-percentage/edit-percentage.component";

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
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    ConfigurableEnumModule,
    MatTooltipModule,
    MatIconModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatInputModule,
    MatNativeDateModule,
    AlertsModule,
    EntitySelectModule,
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
  ],
})
export class EntityFormModule {}
