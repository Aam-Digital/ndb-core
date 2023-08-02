import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { SiteSettings } from "./site-settings";
import { ReplaySubject } from "rxjs";
import { map } from "rxjs/operators";
import { Title } from "@angular/platform-browser";

@Injectable({
  providedIn: "root",
})
export class SiteSettingsService {
  siteSettings = new ReplaySubject<SiteSettings>(1);

  siteName = this.siteSettings.pipe(map(({ siteName }) => siteName));
  defaultLanguage = this.siteSettings.pipe(map(({ language }) => language));
  displayLanguageSelect = this.siteSettings.pipe(
    map(({ displayLanguageSelect }) => displayLanguageSelect),
  );
  logo = this.siteSettings.pipe(map(({ logo }) => logo));
  constructor(
    private entityMapper: EntityMapperService,
    private title: Title,
  ) {
    this.entityMapper
      .load(SiteSettings, "test")
      .then((entity) => this.siteSettings.next(entity))
      .catch(() => undefined);
    this.entityMapper
      .receiveUpdates(SiteSettings)
      .subscribe(({ entity }) => this.siteSettings.next(entity));

    this.siteName.subscribe((name) => {
      this.title.setTitle(name);
    });
  }
}
