import {
  Component,
  ElementRef,
  input,
  model,
  viewChild,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { AddressSearchComponent } from "../address-search/address-search.component";
import { GeoResult, GeoService } from "../geo.service";
import { GeoLocation } from "../geo-location";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatTooltip } from "@angular/material/tooltip";
import { MatExpansionModule } from "@angular/material/expansion";
import { AddressGpsLocationComponent } from "../address-gps-location/address-gps-location.component";

/**
 * Edit a GeoLocation / Address, including options to search via API and customize the string location being saved.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-address-edit",
  imports: [
    AddressSearchComponent,
    MatFormField,
    MatLabel,
    MatInput,
    MatTooltip,
    MatExpansionModule,
    AddressGpsLocationComponent,
  ],
  templateUrl: "./address-edit.component.html",
  styleUrl: "./address-edit.component.scss",
})
export class AddressEditComponent {
  private readonly manualAddressInput =
    viewChild<ElementRef<HTMLTextAreaElement>>("manualAddressInput");

  /**
   * Whenever the user selects an actual looked up location, it is emitted here.
   */
  selectedLocation = model<GeoLocation>();

  /**
   * Whether the search box is enabled and visible.
   */
  disabled = input<boolean>(false);

  private readonly geoService = inject(GeoService);

  partsEdited = false;

  focusManualAddressInput() {
    // switch focus only after the panel's content has rendered
    setTimeout(() => this.manualAddressInput()?.nativeElement.focus(), 0);
  }

  updateLocation(selected: GeoLocation | undefined) {
    this.selectedLocation.set(this.geoService.enrichGeoLocation(selected));
  }

  clearLocation() {
    this.partsEdited = false;
    this.updateLocation(undefined);
  }

  partsMatchText(): boolean {
    const location = this.selectedLocation();
    if (!location?.locationString) {
      return true;
    }
    return (
      this.geoService.composeAddressFromParts(location).trim() ===
      location.locationString.trim()
    );
  }

  updateAddressPart(
    key: "road" | "house_number" | "postcode" | "city" | "country",
    value: string,
  ) {
    this.partsEdited = true;
    this.updateLocation({
      locationString: this.selectedLocation()?.locationString,
      geoLookup: this.selectedLocation()?.geoLookup,
      road: this.selectedLocation()?.road,
      house_number: this.selectedLocation()?.house_number,
      postcode: this.selectedLocation()?.postcode,
      city: this.selectedLocation()?.city,
      country: this.selectedLocation()?.country,
      [key]: value,
    });
  }

  updateLocationString(value: string) {
    const manualAddress: string = value ?? "";
    if (manualAddress === "" && this.selectedLocation()?.geoLookup) {
      this.clearLocation();
      // possible alternative UX: ask user if they want to remove the mapped location also? or update the location with the display_location?
      return;
    }

    this.updateLocation({
      locationString: manualAddress,
      geoLookup: this.selectedLocation()?.geoLookup,
      road: this.selectedLocation()?.road,
      house_number: this.selectedLocation()?.house_number,
      postcode: this.selectedLocation()?.postcode,
      city: this.selectedLocation()?.city,
      country: this.selectedLocation()?.country,
    });
  }

  /**
   * Extracts extra details from the user's input that are not present in the suggestion.
   * Handles abbreviations, punctuation, and house numbers, generically.
   */
  private extractExtraLine(
    userInput: string,
    selectedSuggestion: string,
  ): string {
    // Normalize and split into words
    const normalize = (str: string) =>
      str.replace(/[.,]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

    const inputClean = normalize(userInput);
    const suggestionClean = normalize(selectedSuggestion);

    // Split into word sets for comparison
    const inputWords = new Set(inputClean.split(" "));
    const suggestionWords = new Set(suggestionClean.split(" "));

    // Find words in input that are not in suggestion
    const unmatchedWords = Array.from(inputWords).filter(
      (word) => word && !suggestionWords.has(word),
    );

    // Heuristic: Only keep words that look like house numbers, apartments, or short extras
    const likelyExtras = unmatchedWords.filter(
      (word) =>
        /^[0-9]+[a-zA-Z]?$/i.test(word) || // 17a, 12, 5b
        /^[a-zA-Z]+[0-9]+$/i.test(word) || // Apt5, Haus7
        word.length <= 6, // short extras like "EG", "OG", "Süd"
    );

    // If nothing matches, fallback to all unmatched words
    const resultWords = likelyExtras.length > 0 ? likelyExtras : unmatchedWords;

    // Join and capitalize
    let result = resultWords.join(" ").trim();
    if (result.length > 0) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    return result;
  }
  async updateFromAddressSearch(event: {
    location: GeoLocation;
    userInput: string;
  }) {
    const value = event.location;
    const userInput = event.userInput;

    if (
      value?.geoLookup === this.selectedLocation()?.geoLookup &&
      value?.locationString === this.selectedLocation()?.locationString
    ) {
      // nothing changed, skip
      return;
    }

    let manualAddress: string;

    if (userInput && value?.geoLookup?.display_name) {
      // Extract only unmatched details from user input
      const extra = this.extractExtraLine(
        userInput,
        value.geoLookup.display_name,
      );

      if (extra) {
        manualAddress = value.geoLookup.display_name + "\n" + extra;
      } else {
        manualAddress = value.geoLookup.display_name;
      }
    } else {
      manualAddress =
        value?.locationString ?? value?.geoLookup?.display_name ?? "";
    }

    this.partsEdited = false;
    this.updateLocation({
      locationString: manualAddress,
      geoLookup: value?.geoLookup,
    });
  }

  onGpsLocationSelected(geoResult: GeoResult) {
    this.partsEdited = false;
    const newLocation: GeoLocation = {
      locationString: geoResult.display_name,
      geoLookup: geoResult,
    };
    // For GPS, we don't have user input, so just use the display name
    this.updateLocation(newLocation);
  }
}
