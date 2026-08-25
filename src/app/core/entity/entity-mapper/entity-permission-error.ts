export class EntityPermissionError extends Error {
  constructor(
    public readonly action: string,
    public readonly entityId: string,
    public readonly entityType: string,
  ) {
    // entityId is deliberately kept out of the message: it is per-record (and
    // for new entities even timestamp-based), so interpolating it would defeat
    // Sentry grouping. It stays available as a property and is picked up as
    // structured context by enrichSentryEvent in logging.service.ts.
    super(
      `Current user is not permitted to "${action}" entity of type "${entityType}"`,
    );
    this.name = "EntityPermissionError";
  }
}
