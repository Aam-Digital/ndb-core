import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { catchError, of } from "rxjs";
import { LANGUAGE_LOCAL_STORAGE_KEY, DEFAULT_LANGUAGE } from "../../language/language-statics";
import { ConfigService } from "../../config/config.service";
import { DemoDataSpec } from "./demo-data-spec";
import { Logging } from "../../logging/logging.service";

/**
 * Named pools stored in per-language pool files (`demo-data.<lang>.json`).
 * Each key maps to an array of values; entries may be plain values or objects
 * spanning several fields (applied via Object.assign in the engine).
 */
export type ValuePoolFile = Record<string, any[]>;

/**
 * Loads per-language value pool files for demo data generation.
 *
 * The structural spec (`demoData` in CONFIG_ENTITY) is locale-independent.
 * Localized text (e.g. note stories) lives in `demo-data.<lang>.json` files
 * under the same scenario asset folder.  The active locale is read from
 * localStorage; en-US is used as a fallback.
 *
 * Call `load()` once before generation starts (in `DemoDataService.publishDemoData`)
 * to pre-fetch the pool file.  After that, `getPool(name)` is synchronous.
 */
@Injectable()
export class ValuePoolLoader {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);
  private pools: ValuePoolFile = {};

  /**
   * Fetch the active-locale pool file for the current scenario and cache it.
   * Call this once before starting entity generation.
   */
  async load(): Promise<void> {
    const spec = this.configService.getConfig<DemoDataSpec>("demoData");
    if (!spec) return;

    const locale = this.getActiveLocale();
    const lang = locale.split("-")[0]; // "en-US" → "en"
    const url = `assets/base-configs/demo-data.${lang}.json`;

    this.pools = await firstValueFrom(
      this.http.get<ValuePoolFile>(url).pipe(
        catchError(() => {
          if (lang !== "en") {
            // Try the English fallback
            return this.http.get<ValuePoolFile>("assets/base-configs/demo-data.en.json").pipe(
              catchError(() => {
                Logging.debug(`ValuePoolLoader: no pool file found for locale '${lang}' or fallback 'en'`);
                return of({} as ValuePoolFile);
              }),
            );
          }
          Logging.debug(`ValuePoolLoader: no pool file found for locale '${lang}'`);
          return of({} as ValuePoolFile);
        }),
      ),
    );
  }

  /**
   * Return the named pool (array of values), or an empty array if not found.
   */
  getPool(name: string): any[] {
    return this.pools[name] ?? [];
  }

  private getActiveLocale(): string {
    try {
      return localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) ?? DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  }
}
