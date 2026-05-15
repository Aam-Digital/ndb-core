import {
  Component,
  inject,
  input,
  output,
  effect,
  ChangeDetectionStrategy,
  computed,
  linkedSignal,
} from "@angular/core";
import { EntityConstructor } from "../../../entity/model/entity";
import { ColorMapping } from "../../../entity/model/entity";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import {
  FormBuilder,
  FormControl, FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityConfig } from "../../../entity/entity-config";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from "@angular/material/checkbox";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { AdminEntityService } from "../../admin-entity.service";
import { StringDatatype } from "../../../basic-datatypes/string/string.datatype";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";
import { AnonymizeOptionsComponent } from "../../admin-entity-details/admin-entity-field/anonymize-options/anonymize-options.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ConfigurableEnumDatatype } from "app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { DateOnlyDatatype } from "app/core/basic-datatypes/date-only/date-only.datatype";
import { IconComponent } from "#src/app/core/common-components/icon-input/icon-input.component";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { PhotoDatatype } from "app/features/file/photo.datatype";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { MatExpansionModule } from "@angular/material/expansion";
import { EntityFieldSelectComponent } from "#src/app/core/entity/entity-field-select/entity-field-select.component";
import { ConditionalColorConfigComponent } from "./conditional-color-config/conditional-color-config.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-entity-general-settings",
  templateUrl: "./admin-entity-general-settings.component.html",
  styleUrls: ["./admin-entity-general-settings.component.scss"],
  imports: [
    MatButtonModule,
    MatInputModule,
    FormsModule,
    MatTabsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    BasicAutocompleteComponent,
    MatCheckboxModule,
    MatTableModule,
    MatOptionModule,
    MatSelectModule,
    MatExpansionModule,
    HelpButtonComponent,
    AnonymizeOptionsComponent,
    FaIconComponent,
    IconComponent,
    ConditionalColorConfigComponent,
    HintBoxComponent,
    EntityFieldSelectComponent,
  ],
})
export class AdminEntityGeneralSettingsComponent {
  private fb = inject(FormBuilder);
  private adminEntityService = inject(AdminEntityService);

  entityConstructor = input.required<EntityConstructor>();
  generalSettings = input.required<EntityConfig>();
  showPIIDetailsInput = input<boolean>(false);

  generalSettingsChange = output<EntityConfig>();

  hasImageFields = computed(() =>
    Array.from(this.entityConstructor().schema.values()).some(
      (field) => field.dataType === PhotoDatatype.dataType,
    ),
  );

  showTooltipDetails = linkedSignal(
    () => !!this.generalSettings().toBlockDetailsAttributes,
  );

  showPIIDetails = linkedSignal(() => this.showPIIDetailsInput());

  isConditionalColor = linkedSignal(() => {
    const color = this.generalSettings().color;
    return Array.isArray(color) && (color as ColorMapping[]).length > 0;
  });

  private selectedStringAttributes = linkedSignal<string[]>(
    () => this.generalSettings().toStringAttributes ?? [],
  );

  toStringAttributesOptions = computed<SimpleDropdownValue[]>(() => {
    if (!this.generalSettings().toStringAttributes) return [];

    const selectedKeys = this.selectedStringAttributes();
    const allSchemaOptions = Array.from(
      this.entityConstructor().schema.entries(),
    )
      .filter(
        ([, field]) =>
          [
            StringDatatype.dataType,
            ConfigurableEnumDatatype.dataType,
            DateOnlyDatatype.dataType,
          ].includes(field.dataType) && field.label,
      )
      .map(([key, field]) => ({ value: key, label: field.label }));

    return [
      ...selectedKeys
        .map((key) => allSchemaOptions.find((o) => o.value === key))
        .filter(Boolean),
      ...allSchemaOptions.filter((o) => !selectedKeys.includes(o.value)),
    ];
  });

  fieldAnonymizationDataSource = computed(() => {
    if (!this.showPIIDetails()) return undefined;
    const fields = Array.from(this.entityConstructor().schema.entries())
      .filter(([, field]) => !field.isInternalField)
      .map(([key, field]) => ({ key, label: field.label, field }));
    return new MatTableDataSource(fields);
  });

  basicSettingsForm = linkedSignal(() => {
    const settings = this.generalSettings();
    return this.fb.group({
      label: [settings.label, Validators.required],
      labelPlural: [settings.labelPlural],
      icon: [settings.icon],
      color: [settings.color],
      toStringAttributes: [settings.toStringAttributes],
      hasPII: [settings.hasPII],
      enableUserAccounts: [settings.enableUserAccounts],
      toBlockDetailsAttributes: this.fb.group({
        title: [settings.toBlockDetailsAttributes?.title ?? null],
        image: [
          {
            value: settings.toBlockDetailsAttributes?.image ?? null,
            disabled: !this.hasImageFields(),
          },
        ],
        fields: [settings.toBlockDetailsAttributes?.fields ?? []],
      }),
    });
  });

  iconControl = computed(
    () => this.basicSettingsForm().get("icon") as FormControl<string | null>,
  );

  constructor() {
    effect((onCleanup) => {
      const form = this.basicSettingsForm();
      const sub = form.valueChanges.subscribe(() => {
        const selectedKeys: string[] =
          form.get("toStringAttributes")!.value ?? [];
        this.selectedStringAttributes.set(selectedKeys);
        this.generalSettingsChange.emit(
          form.getRawValue() as unknown as EntityConfig,
        );
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  toggleAnonymizationTable(event: MatCheckboxChange) {
    this.showPIIDetails.set(event.checked);
    this.basicSettingsForm().get("hasPII")!.setValue(event.checked);
  }

  changeFieldAnonymization(
    fieldSchema: EntitySchemaField,
    newAnonymizationValue,
  ) {
    fieldSchema.anonymize = newAnonymizationValue;

    this.adminEntityService.updateSchemaField(
      this.entityConstructor(),
      this.fieldAnonymizationDataSource()!.data.find(
        (v) => v.field === fieldSchema,
      )!.key,
      fieldSchema,
    );
  }

  clearToBlockAttributes() {
    this.basicSettingsForm().get("toBlockDetailsAttributes")!.reset();
  }

  // Filter functions for app-entity-field-select
  hideNonTextFields = (field: EntitySchemaField): boolean =>
    field.dataType === "file" || field.dataType === "photo";

  showOnlyImageFields = (field: EntitySchemaField): boolean =>
    field.dataType !== PhotoDatatype.dataType;

  objectToLabel = (v: SimpleDropdownValue) => v?.label;
  objectToValue = (v: SimpleDropdownValue) => v?.value;

  isFormValid(): boolean {
    const form = this.basicSettingsForm();
    if (!form.valid) {
      form.markAllAsTouched();
      return false;
    }
    return true;
  }
}
