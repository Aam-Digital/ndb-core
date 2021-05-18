import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EditConfigurableEnumComponent } from "./edit-components/edit-configurable-enum/edit-configurable-enum.component";
import { EditTextComponent } from "./edit-components/edit-text/edit-text.component";
import { EditDateComponent } from "./edit-components/edit-date/edit-date.component";
import { EditSelectableComponent } from "./edit-components/edit-selectable/edit-selectable.component";
import { EditAgeComponent } from "./edit-components/edit-age/edit-age.component";
import { EditBooleanComponent } from "./edit-components/edit-boolean/edit-boolean.component";
import { EditLongTextComponent } from "./edit-components/edit-long-text/edit-long-text.component";
import { EditPhotoComponent } from "./edit-components/edit-photo/edit-photo.component";
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
  ],
})
export class EntityFormModule {}
