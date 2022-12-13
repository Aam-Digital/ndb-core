import { Component, OnInit } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { Todo } from "../model/todo";

@DynamicComponent("EditTaskCompletion")
@Component({
  selector: "app-edit-task-completion",
  templateUrl: "./edit-task-completion.component.html",
  styleUrls: ["./edit-task-completion.component.scss"],
})
export class EditTaskCompletionComponent
  extends EditComponent<boolean>
  implements OnInit
{
  date = new Date();
  name = "John Doe";

  ngOnInit(): void {}

  completeClick() {
    console.log("x");

    this.formControl.setValue(true);
    this.createNextRepetition(this.entity as Todo);
  }

  private createNextRepetition(entity: Todo) {
    // TODO: can we only do this once it is saved? or allow an undo?
  }
}
