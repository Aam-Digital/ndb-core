import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TasksRelatedToEntityComponent } from './tasks-related-to-entity/tasks-related-to-entity.component';
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";

@NgModule({
  declarations: [
    TasksRelatedToEntityComponent
  ],
  imports: [CommonModule, EntitySubrecordModule],
})
export class TasksModule {
  static dynamicComponents: [
    TasksRelatedToEntityComponent
  ]
}
