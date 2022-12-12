import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TasksRelatedToEntityComponent } from "./tasks-related-to-entity/tasks-related-to-entity.component";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { EditRecurringIntervalComponent } from "./recurring-interval/edit-recurring-interval/edit-recurring-interval.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { EntityUtilsModule } from "../../core/entity-components/entity-utils/entity-utils.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomIntervalComponent } from "./recurring-interval/custom-interval/custom-interval.component";
import { MatDialogModule } from "@angular/material/dialog";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { timeIntervalDatatype } from "./recurring-interval/time-interval.datatype";

@NgModule({
  declarations: [
    TasksRelatedToEntityComponent,
    EditRecurringIntervalComponent,
    CustomIntervalComponent,
  ],
  imports: [
    CommonModule,
    EntitySubrecordModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    EntityUtilsModule,
    FontAwesomeModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    FormsModule,
    MatDialogModule,
  ],
  exports: [TasksRelatedToEntityComponent, EditRecurringIntervalComponent],
})
export class TasksModule {
  static dynamicComponents: [
    TasksRelatedToEntityComponent,
    EditRecurringIntervalComponent
  ];

  constructor(entitySchemaService: EntitySchemaService) {
    entitySchemaService.registerSchemaDatatype(timeIntervalDatatype);
  }
}
