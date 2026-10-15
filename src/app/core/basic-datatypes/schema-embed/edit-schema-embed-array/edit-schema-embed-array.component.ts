import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { getSchemaEmbedArrayColumns } from "../schema-embed-array-columns";
import { SchemaEmbedArrayDialogComponent } from "./schema-embed-array-dialog/schema-embed-array-dialog.component";
import { DisplaySchemaEmbedArrayComponent } from "../display-schema-embed-array/display-schema-embed-array.component";

/**
 * Generic edit component for the `schema-embed-array` datatype.
 *
 * Renders a short read-only summary (see {@link DisplaySchemaEmbedArrayComponent}) with an
 * icon button, similar to the location field; clicking anywhere in the field (or the button) opens
 * {@link SchemaEmbedArrayDialogComponent}, a popup with the full editable table (one row
 * per array entry, one column per field defined in the field's `additional` schema, or
 * `embeddedType` for subclasses). Edits inside the dialog apply immediately to this field's
 * own FormControl, exactly as the previous inline table did.
 *
 * While the surrounding form isn't in edit mode, the dialog opens read-only.
 * Hovering the summary shows a read-only preview table.
 */
@DynamicComponent("EditSchemaEmbedArray")
@Component({
  selector: "app-edit-schema-embed-array",
  imports: [
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
    DisplaySchemaEmbedArrayComponent,
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
  columns = computed<FormFieldConfig[]>(() =>
    getSchemaEmbedArrayColumns(
      this.formFieldConfig(),
      this.entitySchemaService,
    ),
  );

  rows = computed(() => this.valueSignal() ?? []);

  protected readonly manageLabel = $localize`Manage entries`;
  protected readonly viewLabel = $localize`View entries`;

  /** Opens the dialog - also in view mode, where it is read-only. */
  override onContainerClick() {
    this.openDialog();
  }

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
