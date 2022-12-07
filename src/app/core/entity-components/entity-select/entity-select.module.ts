import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntitySelectComponent } from "./entity-select/entity-select.component";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { EditEntityArrayComponent } from "./edit-entity-array/edit-entity-array.component";
import { EditSingleEntityComponent } from "./edit-single-entity/edit-single-entity.component";
import { DisplayEntityComponent } from "./display-entity/display-entity.component";
import { DisplayEntityArrayComponent } from "./display-entity-array/display-entity-array.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatChipsModule } from "@angular/material/chips";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { EditTextWithAutocompleteComponent } from "./edit-text-with-autocomplete/edit-text-with-autocomplete.component";
import { ViewModule } from "../../view/view.module";

@NgModule({
  declarations: [
    EntitySelectComponent,
    EditEntityArrayComponent,
    EditSingleEntityComponent,
    DisplayEntityComponent,
    DisplayEntityArrayComponent,
    EditTextWithAutocompleteComponent,
  ],
  imports: [
    CommonModule,
    MatAutocompleteModule,
    FontAwesomeModule,
    MatChipsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatInputModule,
    ViewModule,
  ],
  exports: [EntitySelectComponent, DisplayEntityComponent],
})
export class EntitySelectModule {
  static dynamicComponents = [
    EditEntityArrayComponent,
    EditSingleEntityComponent,
    DisplayEntityComponent,
    DisplayEntityArrayComponent,
    EditTextWithAutocompleteComponent,
  ];
}
