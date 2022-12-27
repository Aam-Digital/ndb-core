import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntitySelectComponent } from "./entity-select/entity-select.component";
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from "@angular/material/legacy-autocomplete";
import { EditEntityArrayComponent } from "./edit-entity-array/edit-entity-array.component";
import { EditSingleEntityComponent } from "./edit-single-entity/edit-single-entity.component";
import { DisplayEntityComponent } from "./display-entity/display-entity.component";
import { DisplayEntityArrayComponent } from "./display-entity-array/display-entity-array.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatLegacyChipsModule as MatChipsModule } from "@angular/material/legacy-chips";
import { ReactiveFormsModule } from "@angular/forms";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { EditTextWithAutocompleteComponent } from "./edit-text-with-autocomplete/edit-text-with-autocomplete.component";
import { ViewModule } from "../../view/view.module";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";

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
    MatButtonModule,
  ],
  exports: [
    EntitySelectComponent,
    EditEntityArrayComponent,
    EditSingleEntityComponent,
    DisplayEntityComponent,
    DisplayEntityArrayComponent,
    EditTextWithAutocompleteComponent,
  ],
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
