import { Component, ElementRef, ViewChild } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import {
  EditComponent,
  EditPropertyConfig,
} from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { concatMap, Observable, Subject } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { debounceTime, tap } from "rxjs/operators";

interface GeoLocation {
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

  @ViewChild("inputElement") input: ElementRef<HTMLInputElement>;

  constructor(private http: HttpClient) {
    super();
  }

  onInitFromDynamicConfig(config: EditPropertyConfig<GeoLocation>) {
    super.onInitFromDynamicConfig(config);
    this.filteredOptions = this.inputStream.pipe(
      debounceTime(1000),
      concatMap((res) => this.getGeoLookupResult(res))
    );
  }

  selectLocation(selected: GeoLocation) {
    this.formControl.setValue(selected);
  }

  triggerInputUpdate() {
    this.inputStream.next(this.input.nativeElement.value);
  }

  clearInput() {
    this.formControl.setValue(null);
    this.input.nativeElement.value = "";
  }

  private getGeoLookupResult(searchTerm) {
    return this.http.get<GeoLocation[]>(this.remoteUrl, {
      params: {
        q: searchTerm,
        format: "json",
        countrycodes: "de",
      },
    });
  }
}
