import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
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
import { merge, Subject } from "rxjs";
import { GeoResult, GeoService } from "../geo.service";
import { concatMap, debounceTime, filter, map, tap } from "rxjs/operators";
import { LoggingService } from "../../../core/logging/logging.service";
import { MatButton, MatIconButton } from "@angular/material/button";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

/**
 * A search box integrated with OpenStreetMaps lookup of the entered address,
 * offering matching locations as an autocomplete-style dropdown.
 */
@Component({
  selector: "app-address-search",
  standalone: true,
  imports: [
    MatOption,
    MatAutocomplete,
    MatLabel,
    MatFormField,
    MatAutocompleteTrigger,
    MatInput,
    AsyncPipe,
    MatButton,
    MatIconButton,
    MatSuffix,
    FaIconComponent,
  ],
  templateUrl: "./address-search.component.html",
  styleUrl: "./address-search.component.scss",
})
export class AddressSearchComponent {
  /**
   * The search text, for which locations are looked up (as initial input to prefill the field).
   */
  @Input() set searchText(value: string) {
    if (!(typeof value === "string")) {
      this.logger.debug("Invalid address searchText input", value);
      return;
    }

    this._searchText = value;
  }
  _searchText: string = "";

  /**
   * Whenever the user selects an actual looked up location, it is emitted here.
   */
  @Output() selectedLocationChange = new EventEmitter<GeoResult>();
  /**
   * The initially pre-selected location (displayed in addition to the search field allowing to change it).
   */
  @Input() selectedLocation: GeoResult;

  /**
   * Whether the search box is enabled and visible.
   */
  @Input() disabled: boolean;

  filteredOptions = new Subject<GeoResult[]>();
  loading = false;
  nothingFound = false;

  @ViewChild("inputElement") private inputElem: ElementRef<HTMLInputElement>;
  private inputStream = new Subject<string>();
  private searchClickStream = new Subject<string>();
  private lastSearch: string;

  /** do not display selected item in the input field because this should be an empty search field */
  displayFn = () => "";

  constructor(
    private location: GeoService,
    private logger: LoggingService,
  ) {}

  ngOnInit() {
    this.initSearchPipeline();
  }

  private initSearchPipeline() {
    merge(this.inputStream.pipe(debounceTime(2500)), this.searchClickStream)
      .pipe(
        tap(() => (this.nothingFound = false)),
        map((input) => input.trim()),
        filter((input) => this.isRelevantInput(input)),
        tap(() => (this.loading = true)),
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
      input.localeCompare(this.lastSearch) !== 0 &&
      input.localeCompare(this.selectedLocation?.display_name) !== 0
    );
  }

  selectLocation(selected: GeoResult | undefined) {
    this.selectedLocation = selected;
    this.selectedLocationChange.emit(selected);
    this.filteredOptions.next([]);
  }

  clearLocation() {
    this.selectLocation(undefined);
  }

  private getGeoLookupResult(searchTerm: string) {
    return this.location.lookup(searchTerm).pipe(
      tap((res) => {
        this.lastSearch = searchTerm;
        this.loading = false;
        this.nothingFound = res.length === 0;
      }),
    );
  }
}
