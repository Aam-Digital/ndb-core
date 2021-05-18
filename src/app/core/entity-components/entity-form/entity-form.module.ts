import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditConfigurableEnumComponent } from "./edit-components/edit-configurable-enum/edit-configurable-enum.component";
import { EditTextComponent } from "./edit-components/edit-text/edit-text.component";
import { EditDateComponent } from "./edit-components/edit-date/edit-date.component";
import { EditSelectableComponent } from "./edit-components/edit-selectable/edit-selectable.component";
import { EditAgeComponent } from "./edit-components/edit-age/edit-age.component";
import { EditBooleanComponent } from "./edit-components/edit-boolean/edit-boolean.component";
import { EditLongTextComponent } from "./edit-components/edit-long-text/edit-long-text.component";
import { EditPhotoComponent } from "./edit-components/edit-photo/edit-photo.component";



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
    CommonModule
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
  ]
})
export class EntityFormModule { }
