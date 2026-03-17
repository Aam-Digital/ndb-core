import { Entity } from "../model/entity";

export class EntityPermissionError extends Error {
  constructor(
    public readonly action: string,
    public readonly entity: Entity,
  ) {
    super(
      `Current user is not permitted to "${action}" entity "${entity.getId()}"`,
    );
    this.name = "EntityPermissionError";
  }
}
