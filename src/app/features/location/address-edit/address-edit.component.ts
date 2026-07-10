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
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";

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
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  focusManualAddressInput() {
    // switch focus only after the panel's content has rendered
    setTimeout(() => this.manualAddressInput()?.nativeElement.focus(), 0);
  }

  updateLocation(selected: GeoLocation | undefined) {
    this.selectedLocation.set(this.geoService.enrichGeoLocation(selected));
  }

  clearLocation() {
    this.updateLocation(undefined);
  }

  /**
   * Whether the address text was manually customized by the user, i.e. it no
   * longer matches what we would derive from the structured parts or the mapped
   * location. Inferred (no flag needed): a meaningful manual edit always makes
   * the text diverge from both derivations, so this is self-detecting.
   */
  private isTextManuallyOverwritten(location: GeoLocation | undefined): boolean {
    const text = location?.locationString?.trim();
    if (!text) {
      return false;
    }
    const composedParts = this.geoService
      .composeAddressFromParts(location)
      .trim();
    const displayName = location?.geoLookup?.display_name?.trim();
    return text !== composedParts && text !== displayName;
  }

  /** Drives the in-panel hint that text and structured details are diverging. */
  hasDivergingText(): boolean {
    return this.isTextManuallyOverwritten(this.selectedLocation());
  }

  async updateAddressPart(
    key: "road" | "house_number" | "postcode" | "city" | "country",
    value: string,
  ) {
    const current = this.selectedLocation();
    // Decide BEFORE applying the change: compare the current text against the
    // OLD parts. Comparing against the new parts would always differ and would
    // falsely ask on every edit.
    const textOverwritten = this.isTextManuallyOverwritten(current);

    const updated: GeoLocation = {
      locationString: current?.locationString,
      geoLookup: current?.geoLookup,
      road: current?.road,
      house_number: current?.house_number,
      postcode: current?.postcode,
      city: current?.city,
      country: current?.country,
      [key]: value,
    };
    const updatedText = this.geoService.composeAddressFromParts(updated);

    if (!textOverwritten) {
      // Text was auto-derived → keep it in sync automatically.
      updated.locationString = updatedText;
      this.updateLocation(updated);
      return;
    }

    // Text was manually customized → ask before overwriting it.
    const result = await this.confirmationDialog.getConfirmation(
      $localize`Update address text?`,
      $localize`You changed the address details, so they no longer match the customized address text. Which should be saved?\n\n**Current text:**\n${current?.locationString ?? ""}\n\n**Updated text:**\n${updatedText}`,
      [
        {
          text: $localize`Keep current text`,
          dialogResult: "keep",
          click: () => {},
        },
        {
          text: $localize`Update to match details`,
          dialogResult: "update",
          click: () => {},
        },
      ],
    );

    if (result === "update") {
      updated.locationString = updatedText;
    }
    // "keep" or dismissed: apply the part change but leave the custom text.
    this.updateLocation(updated);
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

    this.updateLocation({
      locationString: manualAddress,
      geoLookup: value?.geoLookup,
    });
  }

  onGpsLocationSelected(geoResult: GeoResult) {
    const newLocation: GeoLocation = {
      locationString: geoResult.display_name,
      geoLookup: geoResult,
    };
    // For GPS, we don't have user input, so just use the display name
    this.updateLocation(newLocation);
  }
}
