import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { SiteSettings } from "./site-settings";
import {
  delay,
  firstValueFrom,
  Observable,
  ReplaySubject,
  skipWhile,
} from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import { Title } from "@angular/platform-browser";
import { FileService } from "../../features/file/file.service";
import materialColours from "@aytek/material-color-picker";

@Injectable({
  providedIn: "root",
})
export class SiteSettingsService {
  siteSettings = new ReplaySubject<SiteSettings>(1);

  siteName = this.getPropertyObservable("siteName");
  language = this.getPropertyObservable("language");
  displayLanguageSelect = this.getPropertyObservable("displayLanguageSelect");
  icon = this.getPropertyObservable("icon").pipe(delay(0));
  constructor(
    private entityMapper: EntityMapperService,
    private title: Title,
    private fileService: FileService,
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
    this.icon.subscribe(async (ic) => {
      // TODO reset when deleted
      const entity = await firstValueFrom(this.siteSettings);
      const imgUrl = await firstValueFrom(
        this.fileService.loadFile(entity, "icon"),
      );
      const favIcon: HTMLLinkElement = document.querySelector("#appIcon");
      favIcon.href = Object.values(imgUrl)[0];
    });
    this.listenToColorUpdates("primary");
    this.listenToColorUpdates("secondary");
    this.listenToColorUpdates("error");
    this.getPropertyObservable("font").subscribe((font) =>
      document.documentElement.style.setProperty("--font-family", font),
    );
  }

  private listenToColorUpdates(property: "primary" | "secondary" | "error") {
    this.getPropertyObservable(property).subscribe((color) => {
      if (color) {
        const palette2 = materialColours(color);
        palette2["A100"] = palette2["200"];
        palette2["A200"] = palette2["300"];
        palette2["A400"] = palette2["500"];
        palette2["A700"] = palette2["800"];
        Object.entries(palette2).forEach(([key, value]) =>
          document.documentElement.style.setProperty(
            `--${property}-${key}`,
            `#${value}`,
          ),
        );
      }
    });
  }

  getPropertyObservable<P extends keyof SiteSettings>(
    property: P,
  ): Observable<SiteSettings[P]> {
    return this.siteSettings.pipe(
      skipWhile((v) => !v[property]),
      map((s) => s[property]),
      distinctUntilChanged(),
    );
  }
}
