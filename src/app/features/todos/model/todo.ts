/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { User } from "../../../core/user/user";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { TimeInterval } from "../recurring-interval/time-interval";
import { TodoCompletion } from "./todo-completion";
import { WarningLevel } from "../../../child-dev-project/warning-level";
import { PLACEHOLDERS } from "../../../core/entity/schema/entity-schema-field";

@DatabaseEntity("Todo")
export class Todo extends Entity {
  static label = $localize`:label for entity:Task`;
  static labelPlural = $localize`:label (plural) for entity:Tasks`;
  static toStringAttributes = ["subject"];

  static create(properties: Partial<Todo>): Todo {
    const instance = new Todo();
    Object.assign(instance, properties);
    return instance;
  }

  @DatabaseField({ label: $localize`:Label:Subject`, showInDetailsView: true })
  subject: string = "";

  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label:Deadline`,
    showInDetailsView: true,
    anonymize: "retain",
  })
  deadline: Date;

  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label:Start date`,
    description: $localize`:Description:When you are planning to start work so that you keep enough time before the actual hard deadline.`,
    showInDetailsView: true,
    anonymize: "retain",
  })
  startDate: Date;

  @DatabaseField({
    label: $localize`:Label:Description`,
    editComponent: "EditLongText",
    showInDetailsView: true,
  })
  description: string = "";

  @DatabaseField({
    label: $localize`:Label:Assigned to`,
    dataType: "entity-array",
    additional: User.ENTITY_TYPE,
    showInDetailsView: true,
    defaultValue: PLACEHOLDERS.CURRENT_USER,
    anonymize: "retain",
  })
  assignedTo: string[] = [];

  /**
   * other records (e.g. a recurring activity, group membership, ...) to which this task is related in some way.
   *
   * This property saves ids including their entity type prefix.
   */
  @DatabaseField({
    dataType: "entity-array",
    label: $localize`:label for the related Entities:Related Records`,
    additional: [
      Child.ENTITY_TYPE,
      School.ENTITY_TYPE,
      RecurringActivity.ENTITY_TYPE,
    ],
    showInDetailsView: true,
    anonymize: "retain",
  })
  relatedEntities: string[] = [];

  @DatabaseField({
    label: $localize`:label for Todo entity property:repeats`,
    additional: [
      {
        label: $localize`:repetition interval option:every week`,
        interval: { amount: 1, unit: "week" },
      },
      {
        label: $localize`:repetition interval option:every month`,
        interval: { amount: 1, unit: "month" },
      },
    ] as { label: string; interval: TimeInterval }[],
    showInDetailsView: true,
    anonymize: "retain",
  })
  repetitionInterval: TimeInterval;

  @DatabaseField({
    label: $localize`:label for Todo entity property:completed`,
    viewComponent: "DisplayTodoCompletion",
    anonymize: "retain",
  })
  completed?: TodoCompletion;

  get isActive(): boolean {
    if (this.inactive) {
      // manual archiving of records takes precendence
      return false;
    }

    return !this.completed;
  }

  get isOverdue(): boolean {
    return !!(
      !this.completed &&
      this.deadline &&
      this.deadline.getTime() < new Date().getTime()
    );
  }

  getWarningLevel(): WarningLevel {
    if (this.isOverdue) {
      return WarningLevel.URGENT;
    }
    if (this.completed) {
      return WarningLevel.OK;
    }
    return WarningLevel.NONE;
  }
}
