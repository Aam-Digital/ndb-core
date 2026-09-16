import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  EventEmitter,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { startWith, Subscription } from "rxjs";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { SchemaEmbedDatatype } from "../schema-embed.datatype";

/** One row of the embedded table: its own form group plus a stub EntityForm to feed EntityFieldEditComponent. */
interface EmbeddedRow {
  formGroup: FormGroup;
  form: EntityForm<any>;
  subscription: Subscription;
}

/**
 * Generic edit component for the `schema-embed-array` datatype.
 *
 * Renders one table row per array entry and one column per field defined in the field's
 * `additional` schema (or `embeddedType`, for subclasses), delegating every cell to the
 * generic {@link EntityFieldEditComponent} so any dataType works inside a row.
 */
@DynamicComponent("EditSchemaEmbedArray")
@Component({
  selector: "app-edit-schema-embed-array",
  imports: [
    ReactiveFormsModule,
    EntityFieldEditComponent,
    MatButtonModule,
    FontAwesomeModule,
    MatTooltipModule,
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
  implements OnInit, EditComponent
{
  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly destroyRef = inject(DestroyRef);

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

  rows = signal<EmbeddedRow[]>([]);
  isDisabled = signal(false);

  /** Authoritative list of row entries (the signal above is a snapshot copy for the template). */
  private rowEntries: EmbeddedRow[] = [];

  ngOnInit() {
    this.formControl.valueChanges
      .pipe(
        startWith(this.formControl.value ?? []),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((values) => this.syncRows(values ?? []));

    this.formControl.statusChanges
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const disabled = this.formControl.disabled;
        this.isDisabled.set(disabled);
        this.rowEntries.forEach((entry) =>
          disabled
            ? entry.formGroup.disable({ emitEvent: false })
            : entry.formGroup.enable({ emitEvent: false }),
        );
      });
  }

  addRow() {
    const current = this.formControl.value ?? [];
    this.formControl.setValue([...current, {}]);
    this.formControl.markAsDirty();
  }

  removeRow(index: number) {
    const current = this.formControl.value ?? [];
    this.formControl.setValue(current.filter((_, i) => i !== index));
    this.formControl.markAsDirty();
  }

  /**
   * Reconcile the internal row entries with an externally/self set array value.
   *
   * Only pushes/pops entries for added/removed rows and only patches a surviving row's
   * FormGroup when its content actually differs - this is what avoids wiping out the
   * user's focus/input on every keystroke, since the row currently being typed into is
   * always already in sync with the value that triggered this call.
   */
  private syncRows(values: Record<string, any>[]) {
    while (this.rowEntries.length < values.length) {
      this.addRowEntry(values[this.rowEntries.length] ?? {});
    }
    while (this.rowEntries.length > values.length) {
      const removed = this.rowEntries.pop();
      removed?.subscription.unsubscribe();
    }

    values.forEach((value, i) => {
      const formGroup = this.rowEntries[i].formGroup;
      if (
        JSON.stringify(formGroup.getRawValue()) !== JSON.stringify(value ?? {})
      ) {
        formGroup.patchValue(value ?? {}, { emitEvent: false });
      }
    });

    this.rows.set([...this.rowEntries]);
  }

  private addRowEntry(value: Record<string, any>) {
    const formGroup = this.buildRowFormGroup(value);
    if (this.isDisabled()) {
      formGroup.disable({ emitEvent: false });
    }

    const entry: EmbeddedRow = {
      formGroup,
      form: {
        formGroup: formGroup as any,
        entity: this.entity(),
        fieldConfigs: this.columns(),
        onFormStateChange: new EventEmitter(),
        inheritedParentValues: new Map(),
        watcher: new Map(),
      },
      subscription: undefined,
    };
    entry.subscription = formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((newValue) => this.onRowChange(entry, newValue));

    this.rowEntries.push(entry);
  }

  private buildRowFormGroup(value: Record<string, any>): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const column of this.columns()) {
      controls[column.id] = new FormControl(value?.[column.id]);
    }
    return new FormGroup(controls);
  }

  private onRowChange(entry: EmbeddedRow, value: Record<string, any>) {
    const index = this.rowEntries.indexOf(entry);
    if (index === -1) {
      return;
    }
    const current = this.formControl.value ?? [];
    const updated = current.map((row, i) => (i === index ? value : row));
    this.formControl.setValue(updated);
    this.formControl.markAsDirty();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.rowEntries.forEach((entry) => entry.subscription.unsubscribe());
  }
}
