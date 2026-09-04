import { Injectable } from "@angular/core";
import {
  DefaultDatatype,
  ExportColumnMapping,
} from "../entity/default-datatype/default.datatype";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { resolveActiveText } from "../language/active-locale";
import { TranslatableText } from "./multi-lingual-config";

/**
 * A user-facing text that admins can configure in several languages (#3862).
 *
 * The transforms stay the identity on purpose: the entity holds the raw value,
 * because resolving here would make every `entityMapper.save()` write back the
 * single resolved string and drop all other languages. This datatype only
 * declares how the value reaches the screen.
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
    return resolveActiveText(value);
  }

  override getExportColumns(
    schemaField: EntitySchemaField,
  ): ExportColumnMapping<TranslatableText>[] {
    return super.getExportColumns(schemaField).map((column) => ({
      ...column,
      resolveValue: (value: TranslatableText) => resolveActiveText(value),
    }));
  }
}
