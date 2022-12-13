import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TodosRelatedToEntityComponent } from "./todos-related-to-entity/todos-related-to-entity.component";
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
import { DisplayRecurringIntervalComponent } from "./recurring-interval/display-recurring-interval/display-recurring-interval.component";
import { TodoCompletionComponent } from "./todo-completion/todo-completion/todo-completion.component";
import { TodoDetailsComponent } from "./todo-details/todo-details.component";
import { CommonComponentsModule } from "../../core/common-components/common-components.module";
import { EntityFormModule } from "../../core/entity-components/entity-form/entity-form.module";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { DisplayTodoCompletionComponent } from "./todo-completion/display-todo-completion/display-todo-completion.component";

@NgModule({
  declarations: [
    TodosRelatedToEntityComponent,
    EditRecurringIntervalComponent,
    CustomIntervalComponent,
    DisplayRecurringIntervalComponent,
    TodoCompletionComponent,
    TodoDetailsComponent,
    DisplayTodoCompletionComponent,
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
    CommonComponentsModule,
    EntityFormModule,
    MatSlideToggleModule,
  ],
  exports: [
    TodosRelatedToEntityComponent,
    EditRecurringIntervalComponent,
    DisplayRecurringIntervalComponent,
  ],
})
export class TodosModule {
  static dynamicComponents: [
    TodosRelatedToEntityComponent,
    EditRecurringIntervalComponent,
    DisplayRecurringIntervalComponent
  ];

  constructor(entitySchemaService: EntitySchemaService) {
    entitySchemaService.registerSchemaDatatype(timeIntervalDatatype);
  }
}
