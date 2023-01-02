import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { ReactiveFormsModule } from "@angular/forms";
import { ConfigurableEnumModule } from "../../configurable-enum/configurable-enum.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { ViewModule } from "../../view/view.module";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
  imports: [
    CommonModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
    ConfigurableEnumModule,
    MatTooltipModule,
    MatInputModule,
    ViewModule,
    MatDatepickerModule,
    MatCheckboxModule,
    FontAwesomeModule,
    MatButtonModule,
  ],
})
export class EntityUtilsModule {}
