import { Pipe, PipeTransform } from "@angular/core";
import { TranslatableText } from "../config/multi-lingual-config";
import { resolveLocaleText } from "./active-locale";

/**
 * Show a configured text in the active language, e.g. `{{ report.title | localeText }}`.
 *
 * Being pure, it only resolves again when the text itself changes -
 * unlike a method call in the template, which reruns on every change detection.
 */
@Pipe({ name: "localeText" })
export class LocaleTextPipe implements PipeTransform {
  transform(value: TranslatableText | null | undefined): string | undefined {
    return resolveLocaleText(value);
  }
}
