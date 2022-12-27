import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataImportComponent } from "./data-import/data-import.component";
import { DataImportService } from "./data-import.service";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatStepperModule } from "@angular/material/stepper";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";
import { AlertsModule } from "../../core/alerts/alerts.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from "@angular/material/legacy-autocomplete";
import { ExportModule } from "../../core/export/export.module";
import { InputFileComponent } from "./input-file/input-file.component";
import { MatExpansionModule } from "@angular/material/expansion";

@NgModule({
  declarations: [DataImportComponent, InputFileComponent],
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
    MatExpansionModule,
  ],
    exports: [DataImportComponent, InputFileComponent],
  providers: [DataImportService],
})
export class DataImportModule {
  static dynamicComponents = [DataImportComponent];
}
