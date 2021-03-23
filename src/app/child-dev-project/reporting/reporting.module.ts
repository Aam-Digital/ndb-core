import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReportingComponent } from "./reporting/reporting.component";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";

@NgModule({
  declarations: [ReportingComponent],
  imports: [CommonModule, MatButtonModule, MatListModule],
})
export class ReportingModule {}
