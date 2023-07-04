import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ImportComponent } from "./import/import.component";
import { MatStepperModule } from "@angular/material/stepper";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ImportSelectFileComponent } from "./import-select-file/import-select-file.component";
import { ImportHistoryComponent } from "./import-history/import-history.component";
import { InputFileComponent } from "../data-import/input-file/input-file.component";
import { ImportSelectTypeComponent } from './import-select-type/import-select-type.component';
import { ImportMapColumnsComponent } from './import-map-columns/import-map-columns.component';
import { ImportReviewDataComponent } from './import-review-data/import-review-data.component';
import { ImportConfirmSummaryComponent } from './import-confirm-summary/import-confirm-summary.component';

@NgModule({
  declarations: [
    ImportComponent,
    ImportSelectFileComponent,
    ImportHistoryComponent,
    ImportSelectTypeComponent,
    ImportMapColumnsComponent,
    ImportReviewDataComponent,
    ImportConfirmSummaryComponent,
  ],
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    FontAwesomeModule,
    InputFileComponent,
  ],
  exports: [ImportComponent],
})
export class ImportModule {}
