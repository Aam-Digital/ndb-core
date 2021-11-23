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

@NgModule({
  declarations: [DataImportComponent],
  imports: [
    CommonModule, 
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule
  ],
  exports: [DataImportComponent],
  providers: [DataImportService],
})
export class DataImportModule {}
