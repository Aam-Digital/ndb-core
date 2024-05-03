import {
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Optional,
  Output,
  Self,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { AsyncPipe, NgForOf, NgIf, NgTemplateOutlet } from "@angular/common";
import { MatFormFieldControl } from "@angular/material/form-field";
import {
  FormControl,
  FormGroupDirective,
  NgControl,
  NgForm,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatInput, MatInputModule } from "@angular/material/input";
import {
  MatAutocompleteModule,
  MatAutocompleteTrigger,
} from "@angular/material/autocomplete";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { distinctUntilChanged, filter, map, startWith } from "rxjs/operators";
import { ErrorStateMatcher } from "@angular/material/core";
import { CustomFormControlDirective } from "./custom-form-control.directive";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import {
  MatChipGrid,
  MatChipInput,
  MatChipRemove,
  MatChipRow,
} from "@angular/material/chips";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltip } from "@angular/material/tooltip";
import { MatIcon } from "@angular/material/icon";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";

interface SelectableOption<O, V> {
  initial: O;
  asString: string;
  asValue: V;
  selected: boolean;
}

/** Custom `MatFormFieldControl` for any select / dropdown field. */
@Component({
  selector: "app-basic-autocomplete",
  templateUrl: "basic-autocomplete.component.html",
  styleUrls: ["./basic-autocomplete.component.scss"],
  providers: [
    { provide: MatFormFieldControl, useExisting: BasicAutocompleteComponent },
  ],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatAutocompleteModule,
    NgForOf,
    MatCheckboxModule,
    NgIf,
    AsyncPipe,
    NgTemplateOutlet,
    MatChipInput,
    MatChipGrid,
    MatChipRow,
    FaIconComponent,
    MatTooltip,
    MatIcon,
    MatChipRemove,
    DragDropModule,
  ],
})
export class BasicAutocompleteComponent<O, V = O>
  extends CustomFormControlDirective<V | V[]>
  implements OnChanges
{
  @ContentChild(TemplateRef) templateRef: TemplateRef<any>;
  // `_elementRef` is protected in `MapInput`
  @ViewChild(MatInput, { static: true }) inputElement: MatInput & {
    _elementRef: ElementRef<HTMLElement>;
  };
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  @Input() valueMapper = (option: O) => option as unknown as V;
  @Input() optionToString = (option: O) => option?.toString();
  @Input() createOption: (input: string) => Promise<O>;
  @Input() hideOption: (option: O) => boolean = () => false;

  /**
   * Whether the user should be able to select multiple values.
   */
  @Input() multi?: boolean;
  @Input() reorder?: boolean;

  /**
   * Whether the user can manually drag & drop to reorder the selected items
   */

  autocompleteOptions: SelectableOption<O, V>[] = [];
  autocompleteForm = new FormControl("");
  autocompleteSuggestedOptions = this.autocompleteForm.valueChanges.pipe(
    filter((val) => typeof val === "string"),
    distinctUntilChanged(),
    map((val) => this.updateAutocomplete(val)),
    startWith([] as SelectableOption<O, V>[]),
  );
  autocompleteFilterFunction: (option: O) => boolean;
  @Output() autocompleteFilterChange = new EventEmitter<(o: O) => boolean>();

  /** whether the "add new" option is logically allowed in the current context (e.g. not creating a duplicate) */
  showAddOption = false;

  get displayText() {
    const values: V[] = Array.isArray(this.value) ? this.value : [this.value];

    return values
      .map((v) => this._options.find((o) => o.asValue === v)?.asString)
      .join(", ");
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled
      ? this.autocompleteForm.disable()
      : this.autocompleteForm.enable();
    this.stateChanges.next();
  }

  @Input() set options(options: O[]) {
    this._options = options.map((o) => this.toSelectableOption(o));
  }

  private _options: SelectableOption<O, V>[] = [];

  _selectedOptions: SelectableOption<O, V>[] = [];

  /**
   * Display the selected items as simple text, as chips or not at all (if used in combination with another component)
   */
  @Input() display: "text" | "chips" | "none" = "text";

  constructor(
    elementRef: ElementRef<HTMLElement>,
    errorStateMatcher: ErrorStateMatcher,
    @Optional() @Self() ngControl: NgControl,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective,
  ) {
    super(
      elementRef,
      errorStateMatcher,
      ngControl,
      parentForm,
      parentFormGroup,
    );
  }

  ngOnInit() {
    this.autocompleteSuggestedOptions.subscribe((options) => {
      this.autocompleteOptions = options;
    });
  }

  ngOnChanges(changes: { [key in keyof this]?: any }) {
    if (changes.valueMapper) {
      this._options.forEach(
        (opt) => (opt.asValue = this.valueMapper(opt.initial)),
      );
    }
    if (changes.optionToString) {
      this._options.forEach(
        (opt) => (opt.asString = this.optionToString(opt.initial)),
      );
    }
    if (changes.value || changes.options) {
      this.setInitialInputValue();

      if (this.autocomplete?.panelOpen) {
        // if new options have been added, make sure to update the visible autocomplete options
        this.showAutocomplete(this.autocompleteForm.value);
      }
    }
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        this.autocompleteOptions,
        event.previousIndex,
        event.currentIndex,
      );
    }
    this._selectedOptions = this.autocompleteOptions.filter((o) => o.selected);
    if (this.multi) {
      this.value = this._selectedOptions.map((o) => o.asValue);
    } else {
      this.value = undefined;
    }
    this.setInitialInputValue();
    this.onChange(this.value);
    this.showAutocomplete(this.autocompleteForm.value);
  }

  showAutocomplete(valueToRevertTo?: string) {
    this.autocompleteForm.setValue("");
    if (!this.multi) {
      // cannot setValue to "" here because the current selection would be lost
      this.autocompleteForm.setValue(this.displayText, { emitEvent: false });
    }
    setTimeout(() => {
      this.inputElement.focus();

      // select all text for easy overwriting when typing to search for options
      (
        this.inputElement._elementRef.nativeElement as HTMLInputElement
      ).select();
      if (valueToRevertTo) {
        this.autocompleteForm.setValue(valueToRevertTo);
      }
    });
    this.focus();
  }

  private updateAutocomplete(inputText: string): SelectableOption<O, V>[] {
    let filteredOptions = this._options.filter(
      (o) => !this.hideOption(o.initial),
    );
    if (inputText) {
      this.autocompleteFilterFunction = (option) =>
        this.optionToString(option)
          .toLowerCase()
          .includes(inputText.toLowerCase());
      this.autocompleteFilterChange.emit(this.autocompleteFilterFunction);

      filteredOptions = filteredOptions.filter((o) =>
        this.autocompleteFilterFunction(o.initial),
      );

      // do not allow users to create a new entry "identical" to an existing one:
      this.showAddOption = !this._options.some(
        (o) => o.asString.toLowerCase() === inputText.toLowerCase(),
      );
    }
    return filteredOptions;
  }

  private setInitialInputValue() {
    this._options.forEach(
      (o) =>
        (o.selected = Array.isArray(this.value)
          ? this.value?.includes(o.asValue)
          : this.value === o.asValue),
    );
    this._selectedOptions = this._options.filter((o) => o.selected);
  }

  select(selected: string | SelectableOption<O, V>) {
    if (typeof selected === "string") {
      this.createNewOption(selected);
      return;
    }

    if (selected) {
      this.selectOption(selected);
    } else {
      this.autocompleteForm.setValue("");
      this._selectedOptions = [];
      this.value = undefined;
    }
    this.onChange(this.value);
  }

  unselect(option: SelectableOption<O, V>) {
    option.selected = false;
    this._selectedOptions = this._options.filter((o) => o.selected);

    if (this.multi) {
      this.value = this._selectedOptions.map((o) => o.asValue);
    } else {
      this.value = undefined;
    }
    this.onChange(this.value);
  }

  async createNewOption(option: string) {
    const createdOption = await this.createOption(option);
    if (createdOption) {
      const newOption = this.toSelectableOption(createdOption);
      this._options.push(newOption);
      this.select(newOption);
    } else {
      // continue editing
      this.showAutocomplete();
      this.autocompleteForm.setValue(option);
    }
  }

  private selectOption(option: SelectableOption<O, V>) {
    if (this.multi) {
      option.selected = !option.selected;
      this._selectedOptions = this._options.filter((o) => o.selected);
      this.value = this._selectedOptions.map((o) => o.asValue);
      // re-open autocomplete to select next option
      this.showAutocomplete();
    } else {
      this._selectedOptions = [option];
      this.value = option.asValue;
      this.blur();
    }
  }

  private toSelectableOption(opt: O): SelectableOption<O, V> {
    return {
      initial: opt,
      asValue: this.valueMapper(opt),
      asString: this.optionToString(opt),
      selected: false,
    };
  }

  onFocusOut(event: FocusEvent) {
    if (
      !this.elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      if (!this.multi && this.autocompleteForm.value === "") {
        this.select(undefined);
      }
      this.blur();
    }
  }

  onContainerClick(event: MouseEvent) {
    if (
      !this._disabled &&
      (event.target as Element).tagName.toLowerCase() != "input"
    ) {
      this.showAutocomplete();
    }
  }

  writeValue(val: V[] | V) {
    super.writeValue(val);
    this.setInitialInputValue();
  }
}
