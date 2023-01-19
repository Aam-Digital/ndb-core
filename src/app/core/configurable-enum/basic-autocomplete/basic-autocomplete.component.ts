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
  ],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicAutocompleteComponent<V, O> implements OnChanges {
  @Input() form: FormControl; // cannot be named "formControl" - otherwise the angular directive grabs this
  @Input() label: string;
  @Input() options: O[] = [];
  // TODO implement multi
  @Input() multi?: boolean;

  @Input() valueMapper: (option: O) => V = (option) => option as any;
  @Input() optionToString: (option: O) => string = (option) =>
    option?.toString();
  @Input() createOption: (input: string) => O;

  @Input() showWrench = false;
  @Output() wrenchClick = new EventEmitter();

  @ContentChild(TemplateRef) templateRef: TemplateRef<O>;

  autocompleteSuggestedOptions = new BehaviorSubject<O[]>([]);
  showAddOption = false;
  addOptionTimeout: any;
  selectedOption: O;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.form || changes.options) {
      this.selectInitialOption();
    }
  }

  private selectInitialOption() {
    const selectedOption = this.options.find(
      (o) => this.valueMapper(o) === this.form.value
    );
    if (selectedOption) {
      this.selectedOption = selectedOption;
    }
  }

  updateAutocomplete(inputText: string) {
    // TODO this behaves problematic when navigating with the up and down buttons
    let filteredEntities = this.options;
    this.showAddOption = false;
    clearTimeout(this.addOptionTimeout);
    if (inputText) {
      filteredEntities = this.options.filter((option) =>
        this.optionToString(option)
          .toLowerCase()
          .includes(inputText.toLowerCase())
      );
      const exists = this.options.find(
        (o) => this.optionToString(o).toLowerCase() === inputText.toLowerCase()
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

  select(selected: string | O) {
    let option: O;
    if (typeof selected === "string") {
      option = this.options.find(
        (e) => this.optionToString(e).toLowerCase() === selected.toLowerCase()
      );
    } else {
      option = selected;
    }

    if (option) {
      this.selectedOption = option;
      this.form.setValue(this.valueMapper(option));
    } else {
      if (selected) {
        this.select(this.createOption(selected as string));
      } else {
        this.selectedOption = undefined;
        this.form.setValue(undefined);
      }
    }
  }
}
