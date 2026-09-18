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
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { TemplateTooltipDirective } from "#src/app/core/common-components/template-tooltip/template-tooltip.directive";
import { SchemaEmbedDatatype } from "../schema-embed.datatype";
import { SchemaEmbedArrayDialogComponent } from "./schema-embed-array-dialog/schema-embed-array-dialog.component";
import { SchemaEmbedArrayTableComponent } from "../schema-embed-array-table/schema-embed-array-table.component";

/**
 * Generic edit component for the `schema-embed-array` datatype.
 *
 * Renders a single button showing the current number of entries; clicking it opens
 * {@link SchemaEmbedArrayDialogComponent}, a popup with the full editable table (one row
 * per array entry, one column per field defined in the field's `additional` schema, or
 * `embeddedType` for subclasses). Edits inside the dialog apply immediately to this field's
 * own FormControl, exactly as the previous inline table did.
 *
 * The button stays visible (but visibly disabled) while the surrounding form isn't in edit
 * mode, and hovering it - whether enabled or disabled - shows a read-only preview table via
 * {@link TemplateTooltipDirective}, the same pattern the attendance datatype's display
 * component uses.
 */
@DynamicComponent("EditSchemaEmbedArray")
@Component({
  selector: "app-edit-schema-embed-array",
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    TemplateTooltipDirective,
    SchemaEmbedArrayTableComponent,
  ],
  templateUrl: "./edit-schema-embed-array.component.html",
  styleUrls: ["./edit-schema-embed-array.component.scss"],
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

  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly dialog = inject(MatDialog);

  /** The inner fields (table columns), each with its resolved viewComponent for the hover preview. */
  columns = computed<FormFieldConfig[]>(() => {
    const fieldConfig = this.formFieldConfig();
    if (!fieldConfig?.dataType) {
      return [];
    }
    const dataType = this.entitySchemaService.getDatatypeOrDefault(
      fieldConfig.dataType,
    ) as SchemaEmbedDatatype;
    return [...dataType.getEffectiveSchema(fieldConfig).values()].map(
      (column) => ({
        ...column,
        viewComponent: this.entitySchemaService.getComponent(column, "view"),
      }),
    ) as FormFieldConfig[];
  });

  rows = computed(() => this.valueSignal() ?? []);
  rowCount = computed(() => this.rows().length);

  openDialog() {
    this.dialog.open(SchemaEmbedArrayDialogComponent, {
      width: "90%",
      maxWidth: "980px",
      maxHeight: "90vh",
      data: {
        formControl: this.formControl,
        columns: this.columns(),
        label: this.formFieldConfig()?.label,
      },
    });
  }
}
