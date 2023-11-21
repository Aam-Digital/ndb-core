import { Component } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgIf } from "@angular/common";

@DynamicComponent("EditDate")
@Component({
  selector: "app-edit-date",
  templateUrl: "./edit-date.component.html",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    ErrorHintComponent,
    FontAwesomeModule,
    MatTooltipModule,
    NgIf,
  ],
  standalone: true,
})
export class EditDateComponent extends EditComponent<Date> {}
