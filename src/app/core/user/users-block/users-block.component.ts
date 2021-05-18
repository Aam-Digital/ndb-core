import { Component, Input } from "@angular/core";
import { User } from "../user";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";
import { LoggingService } from "../../logging/logging.service";

@Component({
  selector: "app-users-block",
  template: `
    {{ authorNames }}
    <span *ngIf="users.length > maxUserThreshold">
      and {{ additionalUsers }} more
    </span>
  `,
})
export class UsersBlockComponent implements OnInitDynamicComponent {
  users: User[] = [];

  @Input() set entities(entities: (User | string)[]) {
    if (this.inputType === "id") {
      this.entityMapperService
        .loadType<User>(User)
        .then((users) => {
          this.users = users.filter((u) =>
            entities.find((e: string) => e === u.getId())
          );
        })
        .catch((error) => {
          this.loggingService.error(error);
        });
    } else {
      this.users = entities as User[];
    }
  }
  @Input() inputType: "id" | "entity" = "id";
  @Input() maxUserThreshold = 2;
  constructor(
    private entityMapperService: EntityMapperService,
    private loggingService: LoggingService
  ) {}

  get additionalUsers(): number {
    return this.users.length - this.maxUserThreshold;
  }

  get authorNames(): string {
    return this.users
      .slice(0, this.maxUserThreshold)
      .map((u) => u.name)
      .join(", ");
  }

  onInitFromDynamicConfig(config: any) {
    this.inputType = "id"; // just to be sure
    this.entities = config.entity[config.id];
  }
}
