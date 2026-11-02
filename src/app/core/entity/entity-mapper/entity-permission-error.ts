import { NotPermittedError } from "#src/app/core/logging/error-classification";

/**
 * The current user's permission rules do not allow the action on the entity.
 *
 * `action`, `entityId` and `entityType` are kept out of the message (they would
 * split the issue in remote monitoring) and reported as extra data instead.
 */
export class EntityPermissionError extends NotPermittedError {
  constructor(
    public readonly action: string,
    public readonly entityId: string,
    public readonly entityType: string,
  ) {
    super("Current user is not permitted this action");
    this.name = "EntityPermissionError";
  }
}
