import { Component, ElementRef, ViewChild } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import {
  EditComponent,
  EditPropertyConfig,
} from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { concatMap, Observable, Subject } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { debounceTime, filter, tap } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { MapPopupComponent } from "../map-popup/map-popup.component";
import { Coordinates } from "../coordinates";

interface GeoLocation extends Coordinates {
  display_name: string;
}

@DynamicComponent("EditLocation")
@Component({
  selector: "app-edit-location",
  templateUrl: "./edit-location.component.html",
  styleUrls: ["./edit-location.component.scss"],
})
export class EditLocationComponent extends EditComponent<GeoLocation> {
  readonly remoteUrl = "https://nominatim.openstreetmap.org/search";
  filteredOptions: Observable<GeoLocation[]>;
  inputStream = new Subject<string>();
  lastSearch: string;
  loading = false;
  nothingFound = false;

  @ViewChild("inputElement") input: ElementRef<HTMLInputElement>;

  constructor(private http: HttpClient, private dialog: MatDialog) {
    super();
  }

  onInitFromDynamicConfig(config: EditPropertyConfig<GeoLocation>) {
    super.onInitFromDynamicConfig(config);
    this.filteredOptions = this.inputStream.pipe(
      filter((input) => this.isRelevantInput(input)),
      debounceTime(200),
      tap(() => (this.loading = true)),
      debounceTime(1000),
      concatMap((res) => this.getGeoLookupResult(res))
    );
  }

  private isRelevantInput<T>(input: T | (T & string)) {
    return (
      !!input &&
      input !== "[object Object]" &&
      input !== this.lastSearch &&
      input !== this.formControl.value?.display_name
    );
  }

  selectLocation(selected: GeoLocation) {
    this.formControl.setValue(selected);
  }

  triggerInputUpdate() {
    this.nothingFound = false;
    this.inputStream.next(this.input.nativeElement.value);
  }

  clearInput() {
    this.formControl.setValue(null);
    this.input.nativeElement.value = "";
  }

  private getGeoLookupResult(searchTerm) {
    return this.http
      .get<GeoLocation[]>(this.remoteUrl, {
        params: {
          q: searchTerm,
          format: "json",
          // TODO make this configurable
          countrycodes: "de",
        },
      })
      .pipe(
        tap((res) => {
          this.lastSearch = searchTerm;
          this.loading = false;
          this.nothingFound = res.length === 0;
        })
      );
  }

  openMap() {
    console.log("selected", this.formControl.value);
    const ref = this.dialog.open(MapPopupComponent, {
      width: "90%",
      height: "90%",
      data: this.formControl.value,
    });
    ref.afterClosed().subscribe((res) => {
      console.log("res", res);
    });
  }
}
