import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ImportComponent } from "./import/import.component";
import { MatStepperModule } from "@angular/material/stepper";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@NgModule({
  declarations: [ImportComponent],
  imports: [CommonModule, MatStepperModule, MatButtonModule, FontAwesomeModule],
  exports: [ImportComponent],
})
export class ImportModule {}
