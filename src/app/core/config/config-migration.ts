/**
 * A ConfigMigration is checked during a full JSON.parse using a reviver function.
 * If the migration does not apply to the given configPart, make sure to return it unchanged.
 * Multiple migrations are chained and can transform the same config part one after the other.
 */
export type ConfigMigration = (key: string, configPart: any) => any;
