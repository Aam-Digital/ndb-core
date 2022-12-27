import { Component, ElementRef, ViewChild } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import {
  EditComponent,
  EditPropertyConfig,
} from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { BehaviorSubject, concatMap, of, Subject } from "rxjs";
import { catchError, debounceTime, filter, map, tap } from "rxjs/operators";
import { MatLegacyDialog as MatDialog } from "@angular/material/legacy-dialog";
import {
  MapPopupComponent,
  MapPopupConfig,
} from "../map-popup/map-popup.component";
import { GeoResult, GeoService } from "../geo.service";
import { Coordinates } from "../coordinates";

@DynamicComponent("EditLocation")
@Component({
  selector: "app-edit-location",
  templateUrl: "./edit-location.component.html",
})
export class EditLocationComponent extends EditComponent<GeoResult> {
  filteredOptions = new Subject<GeoResult[]>();
  loading = false;
  nothingFound = false;

  @ViewChild("inputElement") private inputElem: ElementRef<HTMLInputElement>;
  private inputStream = new Subject<string>();
  private lastSearch: string;

  constructor(private location: GeoService, private dialog: MatDialog) {
    super();
  }

  onInitFromDynamicConfig(config: EditPropertyConfig<GeoResult>) {
    super.onInitFromDynamicConfig(config);
    this.inputStream
      .pipe(
        debounceTime(200),
        map((input) => input.trim()),
        filter((input) => this.isRelevantInput(input)),
        tap(() => (this.loading = true)),
        debounceTime(3000),
        concatMap((res) => this.getGeoLookupResult(res))
      )
      .subscribe((res) => this.filteredOptions.next(res));
  }

  private isRelevantInput(input: string): boolean {
    return (
      !!input &&
      input.length > 3 &&
      input.localeCompare("[object Object]") !== 0 &&
      input.localeCompare(this.lastSearch) !== 0 &&
      input.localeCompare(this.formControl.value?.display_name) !== 0
    );
  }

  selectLocation(selected: GeoResult) {
    this.formControl.setValue(selected);
    this.filteredOptions.next([]);
  }

  triggerInputUpdate() {
    this.nothingFound = false;
    this.inputStream.next(this.inputElem.nativeElement.value);
  }

  clearInput() {
    this.formControl.setValue(null);
  }

  private getGeoLookupResult(searchTerm) {
    return this.location.lookup(searchTerm).pipe(
      tap((res) => {
        this.lastSearch = searchTerm;
        this.loading = false;
        this.nothingFound = res.length === 0;
      })
    );
  }

  openMap() {
    const marked = new BehaviorSubject<Coordinates[]>([this.formControl.value]);
    const mapClick = new Subject<Coordinates>();
    mapClick.subscribe((res) => marked.next([res]));
    const ref = this.dialog.open(MapPopupComponent, {
      width: "90%",
      data: {
        marked,
        mapClick,
        disabled: this.formControl.disabled,
        helpText: $localize`:help text in map popup:Click on the map to select a different location`,
      } as MapPopupConfig,
    });
    if (this.formControl.enabled) {
      ref
        .afterClosed()
        .pipe(concatMap(() => this.lookupCoordinates(marked.value[0])))
        .subscribe((res) => this.formControl.setValue(res));
    }
  }

  private lookupCoordinates(coords: Coordinates) {
    if (!coords) {
      return undefined;
    }
    if (
      coords.lat === this.formControl.value?.lat &&
      coords.lon === this.formControl.value?.lon
    ) {
      return of(this.formControl.value);
    }
    const fallback = {
      display_name: `${coords.lat} - ${coords.lon}`,
      ...coords,
    };
    return this.location.reverseLookup(coords).pipe(
      map((res) => (res["error"] ? fallback : res)),
      catchError(() => of(fallback))
    );
  }
}
