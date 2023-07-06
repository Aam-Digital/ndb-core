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
import { BasicAutocompleteComponent } from "../../core/configurable-enum/basic-autocomplete/basic-autocomplete.component";
import { DisplayEntityComponent } from "../../core/entity-components/entity-select/display-entity/display-entity.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatListModule } from "@angular/material/list";
import { EntitySubrecordComponent } from "../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { DateValueMappingComponent } from "./import-column-mapping/date-value-mapping/date-value-mapping.component";
import { EnumValueMappingComponent } from "./import-column-mapping/enum-value-mapping/enum-value-mapping.component";
import { MatDialogModule } from "@angular/material/dialog";
import { DynamicComponentDirective } from "../../core/view/dynamic-components/dynamic-component.directive";
import { MatInputModule } from "@angular/material/input";
import { ImportService } from "./import.service";
import { EntityTypeLabelPipe } from "../../core/entity-components/entity-type-label/entity-type-label.pipe";

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
    DateValueMappingComponent,
    EnumValueMappingComponent,
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
    BasicAutocompleteComponent,
    DisplayEntityComponent,
    ReactiveFormsModule,
    MatTooltipModule,
    MatListModule,
    EntitySubrecordComponent,
    MatDialogModule,
    DynamicComponentDirective,
    MatInputModule,
  ],
  providers: [ImportService, EntityTypeLabelPipe],
  exports: [ImportComponent],
})
export class ImportModule {}
