import { Component, Input } from "@angular/core";
import { Child } from "../../model/child";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";

@Component({
  selector: "app-dropout-form",
  templateUrl: "./dropout-form.component.html",
  styleUrls: ["./dropout-form.component.scss"],
})
export class DropoutFormComponent {
  @Input() child: Child;

  constructor(private entityMapper: EntityMapperService) {}

  save() {
    // Saving will save all the fields of the child, not just the dropout information
    // Undoing changes that were not saved yet can be done by re-entering the view
    this.entityMapper.save<Child>(this.child);
  }
}
