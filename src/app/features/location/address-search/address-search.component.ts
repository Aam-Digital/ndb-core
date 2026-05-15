import {
  Component,
  ElementRef,
  input,
  output,
  signal,
  ViewChild,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  MatAutocomplete,
  MatAutocompleteTrigger,
  MatOption,
} from "@angular/material/autocomplete";
import {
  MatFormField,
  MatLabel,
  MatSuffix,
} from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { AsyncPipe } from "@angular/common";
import { merge, of, BehaviorSubject, Subject } from "rxjs";
import { GeoResult, GeoService } from "../geo.service";
import {
  catchError,
  concatMap,
  debounceTime,
  filter,
  map,
  tap,
} from "rxjs/operators";
import { Logging } from "../../../core/logging/logging.service";
import { MatIconButton } from "@angular/material/button";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { GeoLocation } from "../geo-location";
import { HttpErrorResponse } from "@angular/common/http";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { OkButton } from "app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";

/**
 * A search box integrated with OpenStreetMaps lookup of the entered address,
 * offering matching locations as an autocomplete-style dropdown.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-address-search",
  imports: [
    MatOption,
    MatAutocomplete,
    MatLabel,
    MatFormField,
    MatAutocompleteTrigger,
    MatInput,
    AsyncPipe,
    MatIconButton,
    MatSuffix,
    FaIconComponent,
  ],
  templateUrl: "./address-search.component.html",
  styleUrl: "./address-search.component.scss",
})
export class AddressSearchComponent implements OnInit {
  private location = inject(GeoService);
  private confirmationDialog = inject(ConfirmationDialogService);

  /** The search text used to prefill the field. */
  searchText = input<string>("");

  /**
   * Whenever the user selects an actual looked up location, it is emitted here.
   */
  locationSelected = output<{
    location: GeoLocation;
    userInput: string;
  }>();

  filteredOptions = new BehaviorSubject<GeoResult[]>([]);
  waiting = signal<boolean>(false);
  loading = signal<boolean>(false);
  nothingFound = signal<boolean>(false);
  networkError = signal<boolean>(false);
  otherTypeError = signal<boolean>(false);
  @ViewChild("inputElement") private inputElem: ElementRef<HTMLInputElement>;
  private inputStream = new Subject<string>();
  private searchClickStream = new Subject<string>();
  private readonly enterKeyStream = new Subject<string>();
  private lastSearch: string;

  /** do not display selected item in the input field because this should be an empty search field */
  displayFn = () => "";

  ngOnInit() {
    this.initSearchPipeline();
  }

  private initSearchPipeline() {
    merge(
      this.inputStream.pipe(debounceTime(2500)),
      this.searchClickStream,
      this.enterKeyStream, // immediate search on ENTER
    )
      .pipe(
        map((input) => input.trim()),
        filter((input) => this.isRelevantInput(input)),
        tap(() => {
          this.nothingFound.set(false);
          this.waiting.set(false);
          this.loading.set(true);
        }),
        concatMap((res) => this.getGeoLookupResult(res)),
      )
      .subscribe((res) => {
        this.filteredOptions.next(res);
        this.loading.set(false);
      });
  }

  private lastUserInput: string = "";

  triggerInputUpdate(event?: KeyboardEvent) {
    this.lastUserInput = this.inputElem.nativeElement.value;
    this.waiting.set(true);
    this.loading.set(false);
    if (event && event.key === "Enter") {
      this.waiting.set(false); // skip waiting if ENTER
      this.loading.set(true);
      this.enterKeyStream.next(this.inputElem.nativeElement.value);
    } else {
      this.inputStream.next(this.inputElem.nativeElement.value);
    }
  }
  searchClick() {
    this.lastUserInput = this.inputElem.nativeElement.value;
    this.waiting.set(false);
    this.loading.set(true);
    this.searchClickStream.next(this.inputElem.nativeElement.value);
  }

  private isRelevantInput(input: string): boolean {
    return (
      !!input &&
      input.length > 3 &&
      input.localeCompare("[object Object]") !== 0 &&
      input.localeCompare(this.lastSearch) !== 0
    );
  }

  async selectLocation(selected: GeoResult | string | undefined) {
    let result: GeoLocation;

    if (typeof selected === "object") {
      result = { geoLookup: selected };
    } else if (typeof selected === "string") {
      await this.confirmationDialog.getConfirmation(
        $localize`No mapped location`,
        $localize`There is no mapped location for the entered address. You can still save the address as free text.`,
        OkButton,
      );
      result = { locationString: selected };
    }

    this.locationSelected.emit({
      location: result,
      userInput: this.lastUserInput,
    });
    this.filteredOptions.next([]);
  }

  private getGeoLookupResult(searchTerm: string) {
    return this.location.lookup(searchTerm).pipe(
      tap((res) => {
        this.networkError.set(false);
        this.otherTypeError.set(false);
        this.lastSearch = searchTerm;
        this.loading.set(false);
        this.nothingFound.set(res.length === 0);
      }),
      catchError((error: HttpErrorResponse) => {
        this.loading.set(false);
        this.nothingFound.set(true);

        if (error.status === 0) {
          this.networkError.set(true);
        } else {
          Logging.warn("Address Lookup API error", error);
          this.otherTypeError.set(true);
        }

        return of([]);
      }),
    );
  }

  isInputInOptions(input: string): boolean {
    if (!input) return false;
    const normalizedInput = input.trim().toLowerCase();
    return this.filteredOptions.value.some(
      (option) => option.display_name.trim().toLowerCase() === normalizedInput,
    );
  }
}
