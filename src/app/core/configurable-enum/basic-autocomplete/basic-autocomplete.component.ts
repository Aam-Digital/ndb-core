import {
  Component,
  ContentChild,
  Input,
  OnChanges,
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
  @Input() multi?: boolean;

  @Input() valueMapper: (option: O) => V = (option) => option as any;
  @Input() optionToString: (option: O) => string = (option) =>
    option?.toString();

  @ContentChild(TemplateRef) templateRef: TemplateRef<O>;

  autocompleteSuggestedOptions = new BehaviorSubject<O[]>([]);
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
    let filteredEntities = this.options;
    if (inputText) {
      filteredEntities = this.options.filter((option) =>
        this.optionToString(option)
          .toLowerCase()
          .includes(inputText.toLowerCase())
      );
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
      this.selectedOption = undefined;
      this.form.setValue(undefined);
    }
  }
}
