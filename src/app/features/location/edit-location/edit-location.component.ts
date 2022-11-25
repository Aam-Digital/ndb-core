import { Component } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import {
  EditComponent,
  EditPropertyConfig,
} from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { BehaviorSubject, concatMap, Observable } from "rxjs";
import { HttpClient, HttpParams } from "@angular/common/http";
import { debounceTime, map, tap } from "rxjs/operators";

@DynamicComponent("EditLocation")
@Component({
  selector: "app-edit-location",
  templateUrl: "./edit-location.component.html",
  styleUrls: ["./edit-location.component.scss"],
})
export class EditLocationComponent extends EditComponent<any> {
  readonly remoteUrl = "https://nominatim.openstreetmap.org/search";
  filteredOptions: Observable<any>;

  constructor(private http: HttpClient) {
    super();
  }

  onInitFromDynamicConfig(config: EditPropertyConfig<any>) {
    super.onInitFromDynamicConfig(config);
    this.filteredOptions = this.formControl.valueChanges.pipe(
      debounceTime(1000),
      concatMap((res) => this.getGeoLookupResult(res)),
      tap((res) => console.log("result", res))
    );
  }

  private getGeoLookupResult(searchTerm: string) {
    return this.http.get(this.remoteUrl, {
      params: {
        q: searchTerm,
        format: "json",
        countrycodes: "de",
      },
    });
  }
}
