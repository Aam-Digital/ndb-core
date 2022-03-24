import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataImportComponent } from "./data-import/data-import.component";
import { DataImportService } from "./data-import.service";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatStepperModule } from "@angular/material/stepper";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { AlertsModule } from "../../core/alerts/alerts.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { ExportModule } from "../../core/export/export.module";
import { FlexModule } from "@angular/flex-layout";

@NgModule({
  declarations: [DataImportComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    ReactiveFormsModule,
    AlertsModule,
    FontAwesomeModule,
    MatAutocompleteModule,
    ExportModule,
    FlexModule,
  ],
  exports: [DataImportComponent],
  providers: [DataImportService],
})
export class DataImportModule {
  static dynamicComponents = [DataImportComponent];
}
