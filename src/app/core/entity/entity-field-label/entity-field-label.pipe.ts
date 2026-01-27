import { inject, Pipe, PipeTransform } from "@angular/core";
import { ColumnConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";
import { EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * Transform a field id/config and entity type into a human-readable field label.
 */
@Pipe({
  name: "entityFieldLabel",
  standalone: true,
})
export class EntityFieldLabelPipe implements PipeTransform {
  private readonly entityFormService = inject(EntityFormService);

  transform(
    field: ColumnConfig,
    entityTypeOrEntity?: EntityConstructor,
  ): string {
    const fieldConfig = this.entityFormService.extendFormFieldConfig(
      field,
      entityTypeOrEntity,
    );

    return fieldConfig?.label ?? fieldConfig?.labelShort;
  }
}
