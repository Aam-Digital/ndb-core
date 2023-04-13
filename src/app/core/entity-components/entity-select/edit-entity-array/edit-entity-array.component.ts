import { Component, Input } from "@angular/core";
import { EditComponent } from "../../entity-utils/dynamic-form-components/edit-component";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
import { EntitySelectComponent } from "../entity-select/entity-select.component";
import { User } from "../../../user/user";
import { SessionService } from "../../../session/session-service/session.service";

@DynamicComponent("EditEntityArray")
@Component({
  selector: "app-edit-entity-array",
  templateUrl: "./edit-entity-array.component.html",
  imports: [EntitySelectComponent],
  standalone: true,
})
export class EditEntityArrayComponent extends EditComponent<string[]> {

  constructor(private sessionService: SessionService) {
    super();
  }
  @Input() showEntities = true;
  placeholder: string;

  @Input() entityName: string;

  ngOnInit() {
    super.ngOnInit();

    this.entityName =
      this.formFieldConfig.additional || this.propertySchema.additional;

    this.placeholder = $localize`:Placeholder for input to add entities|context Add User(s):Add ${this.label}`;

    if (
      this.entityName === User.ENTITY_TYPE &&
      this.entity._rev === undefined &&
      this.formControl.value.length === 0 &&
      this.propertySchema.defaultValue === "$current_user"
    ) {
      const user = this.sessionService.getCurrentUser();
      this.formControl.setValue([user.name]);
    }
  }
}
