import { Injectable } from "@angular/core";
import { SiteSettings } from "./site-settings";
import { delay, firstValueFrom, Observable, skipWhile } from "rxjs";
import { distinctUntilChanged, map, shareReplay } from "rxjs/operators";
import { Title } from "@angular/platform-browser";
import { FileService } from "../../features/file/file.service";
import materialColours from "@aytek/material-color-picker";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { LatestEntity } from "../entity/latest-entity";
import { LoggingService } from "../logging/logging.service";

@Injectable({
  providedIn: "root",
})
export class SiteSettingsService extends LatestEntity<SiteSettings> {
  siteSettings = this.entityUpdated.pipe(shareReplay(1));

  siteName = this.getPropertyObservable("siteName");
  language = this.getPropertyObservable("language");
  displayLanguageSelect = this.getPropertyObservable("displayLanguageSelect");
  icon = this.getPropertyObservable("favicon").pipe(delay(0));
  constructor(
    private title: Title,
    private fileService: FileService,
    entityMapper: EntityMapperService,
    logger: LoggingService,
  ) {
    super(SiteSettings, SiteSettings.ENTITY_ID, entityMapper, logger);
    super.startLoading();

    this.siteName.subscribe((name) => {
      this.title.setTitle(name);
    });
    this.icon.subscribe(async () => {
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
        const palette = materialColours(color);
        palette["A100"] = palette["200"];
        palette["A200"] = palette["300"];
        palette["A400"] = palette["500"];
        palette["A700"] = palette["800"];
        Object.entries(palette).forEach(([key, value]) =>
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
