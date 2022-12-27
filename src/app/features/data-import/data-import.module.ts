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
