import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ImportComponent } from "./import/import.component";
import { MatStepperModule } from "@angular/material/stepper";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ImportFileComponent } from "./import-file/import-file.component";
import { ImportHistoryComponent } from "./import-history/import-history.component";
import { InputFileComponent } from "../data-import/input-file/input-file.component";
import { ImportEntityTypeComponent } from "./import-entity-type/import-entity-type.component";
import { ImportColumnMappingComponent } from "./import-column-mapping/import-column-mapping.component";
import { ImportReviewDataComponent } from "./import-review-data/import-review-data.component";
import { ImportConfirmSummaryComponent } from "./import-confirm-summary/import-confirm-summary.component";
import { ImportAdditionalActionsComponent } from "./import-additional-actions/import-additional-actions.component";
import { MatCardModule } from "@angular/material/card";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { EntityTypeLabelPipe } from "../../core/entity-components/entity-type-label/entity-type-label.pipe";
import { BasicAutocompleteComponent } from "../../core/configurable-enum/basic-autocomplete/basic-autocomplete.component";
import { DisplayEntityComponent } from "../../core/entity-components/entity-select/display-entity/display-entity.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatListModule } from "@angular/material/list";

@NgModule({
  declarations: [
    ImportComponent,
    ImportFileComponent,
    ImportHistoryComponent,
    ImportEntityTypeComponent,
    ImportColumnMappingComponent,
    ImportReviewDataComponent,
    ImportConfirmSummaryComponent,
    ImportAdditionalActionsComponent,
  ],
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    FontAwesomeModule,
    InputFileComponent,
    MatCardModule,
    FormsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    EntityTypeLabelPipe,
    BasicAutocompleteComponent,
    DisplayEntityComponent,
    ReactiveFormsModule,
    MatTooltipModule,
    MatListModule,
  ],
  exports: [ImportComponent],
})
export class ImportModule {}
