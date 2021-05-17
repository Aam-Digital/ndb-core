import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityDetailsComponent } from "./entity-details.component";
import { FormComponent } from "./form/form.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatSelectModule } from "@angular/material/select";
import { MatExpansionModule } from "@angular/material/expansion";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatNativeDateModule } from "@angular/material/core";
import { ViewModule } from "../../view/view.module";
import { EntityModule } from "../../entity/entity.module";
import { AlertsModule } from "../../alerts/alerts.module";
import { ConfigurableEnumModule } from "../../configurable-enum/configurable-enum.module";
import { PermissionsModule } from "../../permissions/permissions.module";
import { PhotoComponent } from "./form/edit-components/photo/photo.component";
import { EditConfigurableEnumComponent } from "./form/edit-components/edit-configurable-enum/edit-configurable-enum.component";
import { EditTextComponent } from "./form/edit-components/edit-text/edit-text.component";
import { EditDateComponent } from "./form/edit-components/edit-date/edit-date.component";
import { EditSelectableComponent } from "./form/edit-components/edit-selectable/edit-selectable.component";
import { EditAgeComponent } from "./form/edit-components/edit-age/edit-age.component";
import { EditBooleanComponent } from "./form/edit-components/edit-boolean/edit-boolean.component";
import { EditLongTextComponent } from "./form/edit-components/edit-long-text/edit-long-text.component";
import { EditPhotoComponent } from "./form/edit-components/edit-photo/edit-photo.component";

@NgModule({
  declarations: [
    EntityDetailsComponent,
    FormComponent,
    PhotoComponent,
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
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatSelectModule,
    MatExpansionModule,
    ViewModule,
    FlexLayoutModule,
    MatButtonModule,
    MatSnackBarModule,
    MatNativeDateModule,
    EntityModule,
    AlertsModule,
    ConfigurableEnumModule,
    PermissionsModule,
  ],
  entryComponents: [
    EditTextComponent,
    EditConfigurableEnumComponent,
    EditDateComponent,
    EditSelectableComponent,
    EditAgeComponent,
    EditBooleanComponent,
    EditLongTextComponent,
    EditPhotoComponent,
  ],
})
export class EntityDetailsModule {}
