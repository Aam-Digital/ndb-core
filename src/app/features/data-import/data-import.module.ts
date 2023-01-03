import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatStepperModule } from "@angular/material/stepper";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { ExportModule } from "../../core/export/export.module";
import { InputFileComponent } from "./input-file/input-file.component";
import { MatExpansionModule } from "@angular/material/expansion";

@NgModule({
  declarations: [InputFileComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatAutocompleteModule,
    ExportModule,
    MatExpansionModule,
  ],
  exports: [InputFileComponent],
})
export class DataImportModule {}
