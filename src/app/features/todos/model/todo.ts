import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { TimeInterval } from "../recurring-interval/time-interval";
import { TodoCompletion } from "./todo-completion";
import { WarningLevel } from "../../../child-dev-project/warning-level";
import { PLACEHOLDERS } from "../../../core/entity/schema/entity-schema-field";

/**
 * Base Entity Type for the Todo Feature.
 *
 * All fields are defined in config (in the database) and customized there,
 * this class only serves as an interface for required fields upon which core functionalities are built.
 */
@DatabaseEntity("Todo")
export class Todo extends Entity {
  static override label = $localize`:label for entity:Task`;
  static override labelPlural = $localize`:label (plural) for entity:Tasks`;
  static override toStringAttributes = ["subject"];
  static override hasPII = true;

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
    dataType: "entity",
    isArray: true,
    additional: "User",
    showInDetailsView: true,
    defaultValue: {
      mode: "dynamic",
      value: PLACEHOLDERS.CURRENT_USER,
    },
    anonymize: "retain",
  })
  assignedTo: string[] = [];

  /**
   * other records (e.g. a recurring activity, group membership, ...) to which this task is related in some way.
   *
   * This property saves ids including their entity type prefix.
   */
  @DatabaseField({
    dataType: "entity",
    isArray: true,
    label: $localize`:label for the related Entities:Related Records`,
    additional: ["Child", "School", RecurringActivity.ENTITY_TYPE],
    entityReferenceRole: "composite",
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

  override get isActive(): boolean {
    if (this.inactive) {
      // manual archiving of records takes precedence
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

  override getWarningLevel(): WarningLevel {
    if (this.isOverdue) {
      return WarningLevel.URGENT;
    }
    if (this.completed) {
      return WarningLevel.OK;
    }
    return WarningLevel.NONE;
  }
}
