import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  forwardRef,
} from "@angular/core";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import {
  NG_VALUE_ACCESSOR,
  FormControl,
  ReactiveFormsModule,
} from "@angular/forms";
import { EntityConstructor } from "../model/entity";
import { EntityRegistry } from "../database-entity.decorator";
import { MatFormField, MatLabel } from "@angular/material/form-field";

/**
 * Component for selecting an entity type from a dropdown.
 */
@Component({
  selector: "app-entity-type-select",
  templateUrl: "./entity-type-select.component.html",
  imports: [
    BasicAutocompleteComponent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EntityTypeSelectComponent),
      multi: true,
    },
  ],
  standalone: true,
})

// TODO: Need to use the CustomFormControlDirective abstract class instead of ControlValueAccessor.
export class EntityTypeSelectComponent implements OnInit {
  @Input() formControl: FormControl;
  @Input() allowMultiSelect = false;
  @Input() label: string;
  @Output() selectedEntity = new EventEmitter();

  entityTypes: EntityConstructor[];
  optionToLabel = (option: EntityConstructor) => option.label;
  optionToId = (option: EntityConstructor) => option.ENTITY_TYPE;
  value: any;
  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(private entityRegistry: EntityRegistry) {}

  ngOnInit() {
    this.entityTypes = this.entityRegistry
      .getEntityTypes(true)
      .map(({ value }) => value);

    this.formControl.valueChanges.subscribe((value) => {
      this.selectedEntity.emit(value);
    });
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
