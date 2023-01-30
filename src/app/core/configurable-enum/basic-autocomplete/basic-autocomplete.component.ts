import {
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
} from "@angular/core";
import {
  AsyncPipe,
  NgClass,
  NgForOf,
  NgIf,
  NgTemplateOutlet,
} from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { BehaviorSubject } from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { filter } from "rxjs/operators";

interface SelectableOption<O, V> {
  initial: O;
  asString: string;
  asValue: V;
  selected: boolean;
}

@UntilDestroy()
@Component({
  selector: "app-basic-autocomplete",
  templateUrl: "./basic-autocomplete.component.html",
  styleUrls: ["./basic-autocomplete.component.scss"],
  standalone: true,
  imports: [
    NgForOf,
    NgTemplateOutlet,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    NgIf,
    FontAwesomeModule,
    MatAutocompleteModule,
    AsyncPipe,
    NgClass,
    MatCheckboxModule,
  ],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicAutocompleteComponent<O, V> implements OnChanges {
  // cannot be named "formControl" - otherwise the angular directive grabs this
  @Input() set form(form: FormControl<V | V[]>) {
    this._form = form;
    this.setInputValue();
    if (form.disabled) {
      this.autocompleteForm.disable();
    }
    form.statusChanges.subscribe((status) => {
      if (status === "DISABLED") {
        this.autocompleteForm.disable();
      } else {
        this.autocompleteForm.enable();
      }
    });
    form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.setInputValue());
  }

  _form: FormControl<V | V[]>;

  @Input() label: string;

  @Input() set options(options: O[]) {
    this._options = options.map((o) => this.toSelectableOption(o));
  }

  _options: SelectableOption<O, V>[] = [];
  @Input() multi?: boolean;

  @Input() set valueMapper(value: (option: O) => V) {
    this._valueMapper = value;
    this._options.forEach((opt) => (opt.asValue = value(opt.initial)));
  }

  private _valueMapper = (option: O) => option as unknown as V;

  @Input() set optionToString(value: (option: O) => string) {
    this._optionToString = value;
    this._options.forEach((opt) => (opt.asString = value(opt.initial)));
  }

  private _optionToString = (option) => option?.toString();

  @Input() createOption: (input: string) => O;

  @Input() showWrench = false;
  @Output() wrenchClick = new EventEmitter();

  @ContentChild(TemplateRef) templateRef: TemplateRef<O>;

  autocompleteForm = new FormControl("");

  autocompleteSuggestedOptions = new BehaviorSubject<SelectableOption<O, V>[]>(
    []
  );
  showAddOption = false;
  addOptionTimeout: any;
  inputValue = "";

  constructor() {
    this.autocompleteForm.valueChanges
      .pipe(filter((val) => typeof val === "string"))
      .subscribe((val) => this.updateAutocomplete(val?.split(", ").pop()));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.form || changes.options) {
      if (this.multi) {
        this._options
          .filter(({ asValue }) => (this._form.value as V[])?.includes(asValue))
          .forEach((o) => (o.selected = true));
      }
      this.setInputValue();
    }
  }

  private setInputValue() {
    if (this.multi) {
      this.autocompleteForm.setValue(
        this._options
          .filter((o) => o.selected)
          .map((o) => o.asString)
          .join(", ")
      );
    } else {
      const selected = this._options.find(
        ({ asValue }) => asValue === this._form.value
      );
      this.autocompleteForm.setValue(selected?.asString ?? "");
    }
  }

  updateAutocomplete(inputText: string) {
    let filteredEntities = this._options;
    this.showAddOption = false;
    clearTimeout(this.addOptionTimeout);
    if (inputText) {
      filteredEntities = this._options.filter((option) =>
        option.asString.toLowerCase().includes(inputText.toLowerCase())
      );
      const exists = this._options.find(
        (o) => o.asString.toLowerCase() === inputText.toLowerCase()
      );
      if (!exists) {
        this.addOptionTimeout = setTimeout(
          () => (this.showAddOption = true),
          1000
        );
      }
    }
    this.autocompleteSuggestedOptions.next(filteredEntities);
  }

  select(selected: string | SelectableOption<O, V>) {
    let option: SelectableOption<O, V>;
    if (typeof selected === "string") {
      option = this._options.find(
        (o) => o.asString.toLowerCase() === selected.toLowerCase()
      );
    } else {
      option = selected;
    }

    if (option) {
      this.selectOption(option);
    } else {
      // TODO not automatically create option but only if clicked on purpose
      if (selected) {
        const newOption = this.toSelectableOption(
          this.createOption(selected as string)
        );
        this._options.push(newOption);
        this.select(newOption);
      } else {
        this.autocompleteForm.setValue("");
        this._form.setValue(undefined);
      }
    }
  }

  private selectOption(option: SelectableOption<O, V>) {
    if (this.multi) {
      option.selected = !option.selected;
      const selected = this._options
        .filter((o) => o.selected)
        .map((o) => o.asValue);
      this._form.setValue(selected);
    } else {
      this._form.setValue(option.asValue);
    }
  }

  private toSelectableOption(opt: O): SelectableOption<O, V> {
    return {
      initial: opt,
      asValue: this._valueMapper(opt),
      asString: this._optionToString(opt),
      selected: false,
    };
  }
}
