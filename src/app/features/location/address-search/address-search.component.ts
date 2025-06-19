import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnInit,
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
  /**
   * The search text, for which locations are looked up (as initial input to prefill the field).
   */
  @Input() set searchText(value: string) {
    if (!(typeof value === "string")) {
      Logging.debug("Invalid address searchText input", value);
      return;
    }

    this._searchText = value;
  }
  _searchText: string = "";

  /**
   * Whenever the user selects an actual looked up location, it is emitted here.
   */
  @Output() locationSelected = new EventEmitter<GeoLocation>();

  filteredOptions = new BehaviorSubject<GeoResult[]>([]);
  loading = false;
  nothingFound = false;
  networkError = false;
  otherTypeError = false;
  @ViewChild("inputElement") private inputElem: ElementRef<HTMLInputElement>;
  private inputStream = new Subject<string>();
  private searchClickStream = new Subject<string>();
  private lastSearch: string;

  /** do not display selected item in the input field because this should be an empty search field */
  displayFn = () => "";

  constructor(
    private location: GeoService,
    private confirmationDialog: ConfirmationDialogService,
  ) {}

  ngOnInit() {
    this.initSearchPipeline();
  }

  private initSearchPipeline() {
    merge(this.inputStream.pipe(debounceTime(2500)), this.searchClickStream)
      .pipe(
        map((input) => input.trim()),
        filter((input) => this.isRelevantInput(input)),
        tap(() => {
          this.nothingFound = false;
          this.loading = true;
        }),
        debounceTime(200),
        concatMap((res) => this.getGeoLookupResult(res)),
      )
      .subscribe((res) => this.filteredOptions.next(res));
  }

  triggerInputUpdate() {
    this.inputStream.next(this.inputElem.nativeElement.value);
  }
  searchClick() {
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

    this.locationSelected.emit(result);
    this.filteredOptions.next([]);
  }

  private getGeoLookupResult(searchTerm: string) {
    return this.location.lookup(searchTerm).pipe(
      tap((res) => {
        this.networkError = false;
        this.otherTypeError = false;
        this.lastSearch = searchTerm;
        this.loading = false;
        this.nothingFound = res.length === 0;
      }),
      catchError((error: HttpErrorResponse) => {
        this.loading = false;
        this.nothingFound = true;

        if (error.status === 0) {
          this.networkError = true;
        } else {
          Logging.warn("Address Lookup API error", error);
          this.otherTypeError = true;
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
