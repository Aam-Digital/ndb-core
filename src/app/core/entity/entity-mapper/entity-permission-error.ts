export class EntityPermissionError extends Error {
  constructor(
    public readonly action: string,
    public readonly entityId: string,
    public readonly entityType: string,
  ) {
    // action, entityId and entityType are deliberately kept out of the message
    // (entityId is per-record and, for new entities, even timestamp-based; all
    // three would otherwise fragment Sentry grouping). They stay available as
    // properties and are picked up as structured context by enrichSentryEvent
    // in logging.service.ts, so they remain visible in Sentry's "Additional
    // Data" without being part of the message or name.
    super("Current user is not permitted this action");
    this.name = "EntityPermissionError";
  }
}
