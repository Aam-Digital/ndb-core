import { Component, ElementRef, ViewChild } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import {
  EditComponent,
  EditPropertyConfig,
} from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { concatMap, Subject } from "rxjs";
import { debounceTime, filter, map, tap } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { MapPopupComponent } from "../map-popup/map-popup.component";
import { GeoResult, GeoService } from "../geo.service";

@DynamicComponent("EditLocation")
@Component({
  selector: "app-edit-location",
  templateUrl: "./edit-location.component.html",
  styleUrls: ["./edit-location.component.scss"],
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
        debounceTime(1000),
        concatMap((res) => this.getGeoLookupResult(res))
      )
      .subscribe((res) => this.filteredOptions.next(res));
  }

  private isRelevantInput(input: string): boolean {
    return (
      !!input &&
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
    this.inputElem.nativeElement.value = "";
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
    const ref = this.dialog.open(MapPopupComponent, {
      width: "90%",
      data: {
        coordinates: this.formControl.value,
        disabled: this.formControl.disabled,
      },
    });
    ref
      .afterClosed()
      .pipe(
        filter((res) => !!res),
        concatMap((res) => this.location.reverseLookup(res))
      )
      // TODO maybe remove name of building (e.g. CRCLR House)
      .subscribe((res) => this.formControl.setValue(res));
  }
}
