export class EntityPermissionError extends Error {
  constructor(
    public readonly action: string,
    public readonly entityId: string,
    public readonly entityType: string,
  ) {
    super(
      `Current user is not permitted to "${action}" entity "${entityId}" (${entityType})`
    );
    this.name = "EntityPermissionError";
  }
}
