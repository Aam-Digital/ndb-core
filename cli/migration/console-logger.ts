import { colorErr } from "../lib/colors.js";
import type { MigrationLogger } from "./migration-definition.js";

export class ConsoleLogger implements MigrationLogger {
  constructor(private verboseEnabled: boolean) {}

  info(msg: string): void {
    console.log(`    ${msg}`);
  }

  warn(msg: string): void {
    console.warn(colorErr("yellow", `    ! ${msg}`));
  }

  error(msg: string): void {
    console.error(colorErr("red", `    ✗ ${msg}`));
  }

  verbose(msg: string): void {
    if (this.verboseEnabled) console.log(`    ${msg}`);
  }
}
