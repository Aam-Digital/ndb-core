import { Injectable } from "@angular/core";
import {
  DefaultDatatype,
  ExportColumnMapping,
} from "../entity/default-datatype/default.datatype";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { resolveLocaleText } from "../language/active-locale";
import { TranslatableText } from "./multi-lingual-config";

/**
 * A user-facing text that admins can configure in several languages.
 *
 * The transforms stay the identity on purpose, so the entity keeps the raw value:
 * resolving here would make every `save()` drop the other languages.
 */
@Injectable()
export class TranslatableTextDatatype extends DefaultDatatype<
  TranslatableText,
  TranslatableText
> {
  static override dataType = "translatable-text";
  static override label: string = $localize`:datatype-label:text (multi-lingual)`;

  override viewComponent = "DisplayTranslatableText";
  override editComponent = "EditTranslatableText";

  override sortValue(value: TranslatableText): string | undefined {
    return resolveLocaleText(value);
  }

  override getExportColumns(
    schemaField: EntitySchemaField,
  ): ExportColumnMapping<TranslatableText>[] {
    return super.getExportColumns(schemaField).map((column) => ({
      ...column,
      resolveValue: (value: TranslatableText) => resolveLocaleText(value),
    }));
  }
}
