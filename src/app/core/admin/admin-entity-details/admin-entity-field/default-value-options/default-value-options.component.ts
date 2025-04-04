import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  DefaultValueConfig,
  DefaultValueMode,
} from "../../../../entity/schema/default-value-config";
import {
  MatError,
  MatFormField,
  MatLabel,
  MatSuffix,
} from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
} from "@angular/forms";
import {
  MatButtonToggle,
  MatButtonToggleGroup,
} from "@angular/material/button-toggle";
import { MatTooltip } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatOption, MatSelect } from "@angular/material/select";
import { asArray } from "app/utils/asArray";
import { EntityFieldLabelComponent } from "../../../../common-components/entity-field-label/entity-field-label.component";
import { EntityConstructor } from "../../../../entity/model/entity";
import { EntityRegistry } from "../../../../entity/database-entity.decorator";
import { EntityDatatype } from "../../../../basic-datatypes/entity/entity.datatype";
import { filter } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { AutomatedFieldMappingComponent } from "app/features/automated-status-update/automated-field-mapping/automated-field-mapping.component";
import { lastValueFrom } from "rxjs";

@Component({
  selector: "app-default-value-options",
  imports: [
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    ReactiveFormsModule,
    FormsModule,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatTooltip,
    FaIconComponent,
    MatSuffix,
    MatIconButton,
    MatSelect,
    MatOption,
    EntityFieldLabelComponent,
    MatButtonModule,
  ],
  templateUrl: "./default-value-options.component.html",
  styleUrl: "./default-value-options.component.scss",
})
export class DefaultValueOptionsComponent implements OnChanges {
  @Input() value: DefaultValueConfig;
  @Output() valueChange = new EventEmitter<DefaultValueConfig>();

  @Input() entityType: EntityConstructor;
  selectedRelatedEntity: any;

  form: FormGroup;
  mode: DefaultValueMode;

  @ViewChild("inputElement") inputElement: ElementRef;
  @ViewChild("inheritedFieldSelect") inheritedFieldSelectElement: MatSelect;

  availableInheritanceAttributes: string[];
  currentInheritanceFields: {
    localAttribute: string;
    referencedEntityType: EntityConstructor;
    availableFields: string[];
  };
  relatedEntity: string[];

  constructor(
    private entityRegistry: EntityRegistry,
    private matDialog: MatDialog,
  ) {
    this.initForm();
  }

  private initForm() {
    this.form = new FormGroup(
      {
        mode: new FormControl(this.value?.mode),
        value: new FormControl(this.value?.value, {
          validators: [this.requiredForMode(["static", "dynamic"])],
        }),
        localAttribute: new FormControl(this.value?.localAttribute, {
          validators: [this.requiredForMode("inherited")],
        }),
        field: new FormControl(this.value?.field, {
          validators: [this.requiredForMode("inherited")],
        }),
        relatedEntity: new FormControl(
          this.value?.automatedConfigRule?.[0]?.relatedEntity,
        ),
      },
      { updateOn: "blur" },
    );

    this.form
      .get("mode")
      .valueChanges.subscribe((mode) => this.switchMode(mode));
    this.form.get("relatedEntity").valueChanges.subscribe((selectedEntity) => {
      this.selectedRelatedEntity = selectedEntity;
    });
    this.form.get("value").valueChanges.subscribe((value) => {
      if (!this.mode && !!value) {
        // set default mode as "static" after user started typing a value
        this.mode = "static";
        this.form.get("mode").setValue(this.mode, { emitEvent: false });
      }
    });
    this.form
      .get("localAttribute")
      .valueChanges.subscribe((v) => this.updateCurrentInheritanceFields(v));
    this.form.valueChanges
      .pipe(
        filter((v) => {
          this.form
            .get("localAttribute")
            .updateValueAndValidity({ emitEvent: false });
          this.form.get("field").updateValueAndValidity({ emitEvent: false });
          this.form.get("value").updateValueAndValidity({ emitEvent: false });

          return this.form.valid;
        }),
      )
      .subscribe(() => this.emitValue());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value) {
      this.updateForm(this.value);
    }
    if (changes.entityType) {
      this.updateAvailableInheritanceAttributes();
      this.updateAvilableRelatedEntity();
    }
  }

  private updateForm(newValue: DefaultValueConfig) {
    this.form.get("mode").setValue(newValue?.mode);
    this.form.get("value").setValue(newValue?.value);
    this.form.get("localAttribute").setValue(newValue?.localAttribute);
    this.form.get("field").setValue(newValue?.field);

    this.mode = newValue?.mode;
  }

  private switchMode(mode: DefaultValueMode) {
    this.mode = mode;

    this.form.get("value").setValue(null);
    this.form.get("localAttribute").setValue(null);
    this.form.get("field").setValue(null);
  }

  private emitValue() {
    let newConfigValue: DefaultValueConfig | undefined = undefined;

    switch (this.mode) {
      case "static":
      case "dynamic":
        newConfigValue = {
          mode: this.mode,
          value: this.form.get("value").value,
        };
        break;
      case "inherited":
        newConfigValue = {
          mode: this.mode,
          localAttribute: this.form.get("localAttribute").value,
          field: this.form.get("field").value,
        };
      case "AutomatedConfigRule":
        newConfigValue = {
          mode: this.mode,
          automatedConfigRule: [
            {
              relatedEntity: this.form.get("relatedEntity").value,
              relatedField: "",
              automatedMapping: {},
            },
          ],
        };
        break;
    }

    if (JSON.stringify(newConfigValue) !== JSON.stringify(this.value)) {
      this.value = newConfigValue;
      this.valueChange.emit(newConfigValue);
    }
  }
  async openAutomatedMappingDialog(entity: any) {
    console.log(entity, "Open automated mapping dialog");
    const dialogRef = this.matDialog.open(AutomatedFieldMappingComponent, {
      maxHeight: "90vh",
      data: { entity: entity },
    });
    const action = await lastValueFrom(dialogRef.afterClosed());
  }

  private requiredForMode(
    mode: DefaultValueMode | DefaultValueMode[],
  ): ValidatorFn {
    const modes = asArray(mode);
    return (control) => {
      if (modes.includes(this.form?.get("mode")?.value) && !control.value) {
        return { requiredForMode: true };
      }
      return null;
    };
  }

  private updateAvailableInheritanceAttributes() {
    this.availableInheritanceAttributes = Array.from(
      this.entityType.schema.entries(),
    )
      .filter(([_, schema]) => schema.dataType === EntityDatatype.dataType)
      .map(([id]) => id);
  }

  private updateAvilableRelatedEntity() {
    this.relatedEntity = Array.from(this.entityType.schema.entries())
      .filter(([_, schema]) => schema.dataType === EntityDatatype.dataType)
      .map(([_, schema]) => schema.additional)
      .filter((value) => value !== undefined);

    this.relatedEntity = [...new Set(this.relatedEntity)];
  }

  private updateCurrentInheritanceFields(localAttribute: string) {
    this.form.get("field").setValue(null);

    if (!localAttribute) {
      this.currentInheritanceFields = undefined;
      return;
    }

    const fieldSchema = this.entityType.schema.get(localAttribute);
    const referencedEntityType: EntityConstructor = !!fieldSchema
      ? this.entityRegistry.get(fieldSchema?.additional)
      : undefined;
    if (!referencedEntityType) {
      return;
    }

    const availableFields = Array.from(referencedEntityType.schema.entries())
      .filter(([_, schema]) => !!schema.label) // only "user-facing" fields (i.e. with label)
      .map(([id]) => id);

    this.currentInheritanceFields = {
      localAttribute,
      referencedEntityType,
      availableFields,
    };

    setTimeout(() => this.inheritedFieldSelectElement.open());
  }

  clearDefaultValue() {
    this.updateForm(undefined);
    setTimeout(() => this.inputElement.nativeElement.blur(), 100);
  }
}
