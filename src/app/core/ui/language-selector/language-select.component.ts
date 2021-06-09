import { Component, OnInit } from "@angular/core";
import { TranslationService } from "../../translation/translation.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { startWith } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";

@Component({
  selector: "app-language-select",
  templateUrl: "./language-select.component.html",
  styleUrls: ["./language-select.component.scss"],
})
@UntilDestroy()
export class LanguageSelectComponent implements OnInit {
  siteLanguage: string;

  constructor(private translationService: TranslationService) {
    this.siteLanguage = translationService.currentRegionCode();
  }

  get languageList(): { locale: string; regionCode: string }[] {
    return this.translationService.availableLocales;
  }

  onChange(selectedLang: string) {
    this.translationService.switchToLanguage(selectedLang);
  }

  ngOnInit(): void {
    console.log(this.siteLanguage);
  }
}
