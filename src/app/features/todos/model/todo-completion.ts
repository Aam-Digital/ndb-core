/**
 * meta details for completion of a Todo item.
 */
export class TodoCompletion {
  /** user id of who completed the task */
  completedBy: string;

  /** when the item was completed */
  completedAt: Date;

  /** the next task that was automatically created based on the repetitionInterval */
  nextRepetition?: string;
}
