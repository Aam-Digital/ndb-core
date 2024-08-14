import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { TimeInterval } from "../recurring-interval/time-interval";
import { TodoCompletion } from "./todo-completion";
import { WarningLevel } from "../../../child-dev-project/warning-level";
import { DatabaseField } from "../../../core/entity/database-field.decorator";

/**
 * Base Entity Type for the Todo Feature.
 *
 * All fields are defined in config (in the database) and customized there,
 * this class only serves as an interface for required fields upon which core functionalities are built.
 */
@DatabaseEntity("Todo")
export class Todo extends Entity {
  static create(properties: Partial<Todo>): Todo {
    const instance = new Todo();
    Object.assign(instance, properties);
    return instance;
  }

  @DatabaseField()
  subject: string = "";

  @DatabaseField()
  description: string = "";

  @DatabaseField({ dataType: "date-only" })
  deadline: Date;

  /**
   * Optional field to specify a point in time from when the task can be started.
   */
  @DatabaseField({ dataType: "date-only" })
  startDate?: Date;

  @DatabaseField({ dataType: "entity", isArray: true })
  assignedTo: string[] = [];

  /**
   * other records (e.g. a recurring activity, group membership, ...) to which this task is related in some way.
   *
   * This property saves ids including their entity type prefix.
   */
  @DatabaseField({ dataType: "entity", isArray: true })
  relatedEntities: string[] = [];

  @DatabaseField()
  repetitionInterval: TimeInterval;

  @DatabaseField()
  completed?: TodoCompletion;

  get isActive(): boolean {
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
