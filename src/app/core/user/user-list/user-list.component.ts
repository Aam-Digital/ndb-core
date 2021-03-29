import { Component, Input } from "@angular/core";
import { User } from "../user";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";

@Component({
  selector: "app-user-list",
  template: `{{ authorNames }}`,
})
export class UserListComponent implements OnInitDynamicComponent {
  _users: User[] = [];

  @Input() set entities(entities: (User | string)[]) {
    if (this.inputType === "id") {
      this.entityMapperService.loadType<User>(User).then((users) => {
        this._users = users.filter((u) =>
          entities.find((e: string) => e === u.getId())
        );
      });
    } else {
      this._users = entities as User[];
    }
  }
  @Input() inputType: "id" | "entity" = "id";
  @Input() maxUserThreshold = 2;
  constructor(private entityMapperService: EntityMapperService) {}

  get authorNames(): string {
    if (this._users.length <= this.maxUserThreshold) {
      return this._users.map((u) => u.name).join(", ");
    } else {
      const additionalUsers: string = String(
        this._users.length - this.maxUserThreshold
      );
      return (
        this._users
          .slice(0, this.maxUserThreshold)
          .map((u) => u.name)
          .join(", ") +
        " and " +
        additionalUsers +
        " more"
      );
    }
  }

  onInitFromDynamicConfig(config: any) {
    this.inputType = "id"; // just to be sure
    this.entities = config.entity[config.id];
  }
}
