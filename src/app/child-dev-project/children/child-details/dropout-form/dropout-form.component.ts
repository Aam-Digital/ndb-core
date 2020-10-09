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
  editing: boolean = false;

  constructor(private entityMapper: EntityMapperService) {}

  save() {
    this.editing = false;
    this.entityMapper.save<Child>(this.child);
  }

  edit() {
    this.editing = true;
  }

  cancel() {
    this.editing = false;
    this.entityMapper
      .load<Child>(Child, this.child.getId())
      .then((tmpChild) => {
        this.child.dropoutDate = tmpChild.dropoutDate;
        this.child.dropoutType = tmpChild.dropoutType;
        this.child.dropoutRemarks = tmpChild.dropoutRemarks;
      });
  }
}
