import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { SchemaEmbedDatatype } from "../schema-embed.datatype";
import { SchemaEmbedArrayDialogComponent } from "./schema-embed-array-dialog/schema-embed-array-dialog.component";
import { DisplaySchemaEmbedArrayComponent } from "../display-schema-embed-array/display-schema-embed-array.component";

/**
 * Generic edit component for the `schema-embed-array` datatype.
 *
 * While editable, renders a single button showing the current number of entries; clicking
 * it opens {@link SchemaEmbedArrayDialogComponent}, a popup with the full editable table (one
 * row per array entry, one column per field defined in the field's `additional` schema, or
 * `embeddedType` for subclasses). Edits inside the dialog apply immediately to this field's
 * own FormControl, exactly as the previous inline table did.
 *
 * While disabled (read-only view mode), the surrounding `mat-form-field` sets
 * `pointer-events: none` on itself (Material's standard disabled-field behavior), which would
 * make the button unclickable - so a plain, non-interactive read-only preview is rendered
 * instead via {@link DisplaySchemaEmbedArrayComponent}, matching how every other field type
 * still shows its value inline while disabled.
 */
@DynamicComponent("EditSchemaEmbedArray")
@Component({
  selector: "app-edit-schema-embed-array",
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    DisplaySchemaEmbedArrayComponent,
  ],
  templateUrl: "./edit-schema-embed-array.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditSchemaEmbedArrayComponent,
    },
  ],
})
export class EditSchemaEmbedArrayComponent
  extends CustomFormControlDirective<Record<string, any>[]>
  implements EditComponent
{
  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly dialog = inject(MatDialog);

  /** The inner fields (table columns) resolved from the field's schema-embed configuration. */
  columns = computed<FormFieldConfig[]>(() => {
    const fieldConfig = this.formFieldConfig();
    if (!fieldConfig?.dataType) {
      return [];
    }
    const dataType = this.entitySchemaService.getDatatypeOrDefault(
      fieldConfig.dataType,
    ) as SchemaEmbedDatatype;
    return [
      ...dataType.getEffectiveSchema(fieldConfig).values(),
    ] as FormFieldConfig[];
  });

  rowCount = computed(() => this.valueSignal()?.length ?? 0);

  openDialog() {
    this.dialog.open(SchemaEmbedArrayDialogComponent, {
      width: "90%",
      maxWidth: "980px",
      maxHeight: "90vh",
      data: {
        formControl: this.formControl,
        columns: this.columns(),
        entity: this.entity(),
        label: this.formFieldConfig()?.label,
      },
    });
  }
}
