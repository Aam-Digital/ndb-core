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
import { BehaviorSubject, Subscription } from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatCheckboxModule } from "@angular/material/checkbox";

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
  @Input() form: FormControl; // cannot be named "formControl" - otherwise the angular directive grabs this
  @Input() label: string;

  @Input() set options(options: O[]) {
    this._options = options.map((o) => this.toSelectableOption(o));
  }

  _options: SelectableOption<O, V>[] = [];
  // TODO implement multi
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

  autocompleteSuggestedOptions = new BehaviorSubject<SelectableOption<O, V>[]>(
    []
  );
  showAddOption = false;
  addOptionTimeout: any;
  selectedOption: SelectableOption<O, V>;
  private formSubscription: Subscription;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.form || changes.options) {
      this.selectCurrentOption();
    }
    if (!this.formSubscription && changes.form) {
      this.formSubscription = this.form.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe(() => this.selectCurrentOption());
    }
  }

  private selectCurrentOption() {
    this.selectedOption = this._options.find(
      (o) => o.asValue === this.form.value
    );
  }

  updateAutocomplete(inputText: string) {
    // TODO this behaves problematic when navigating with the up and down buttons
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
      option.selected = true;
      this.form.setValue(option.asValue);
    } else {
      if (selected) {
        const newOption = this.toSelectableOption(
          this.createOption(selected as string)
        );
        this._options.push(newOption);
        this.select(newOption);
      } else {
        this.form.setValue(undefined);
      }
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
