import { Component, OnInit } from "@angular/core";
import { TranslationService } from "../../translation/translation.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-language-select",
  templateUrl: "./language-select.component.html",
  styleUrls: ["./language-select.component.scss"],
})
@UntilDestroy()
export class LanguageSelectComponent implements OnInit {
  siteLanguage: string = "us";

  constructor(private translationService: TranslationService) {}

  get languageList(): string[] {
    return this.translationService.availableLocales;
  }

  async onChange(selectedLang: string) {
    await this.translationService.switchToLanguage(selectedLang);
  }

  ngOnInit(): void {
    this.translationService.onLanguageChange
      .pipe(
        startWith(this.translationService.currentLocale()),
        untilDestroyed(this)
      )
      .subscribe((next) => {
        this.siteLanguage = next;
      });
  }
}
