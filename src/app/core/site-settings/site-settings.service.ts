import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { SiteSettings } from "./site-settings";
import { delay, firstValueFrom, Observable, ReplaySubject } from "rxjs";
import { distinctUntilChanged, filter, map } from "rxjs/operators";
import { Title } from "@angular/platform-browser";
import { FileService } from "../../features/file/file.service";

@Injectable({
  providedIn: "root",
})
export class SiteSettingsService {
  siteSettings = new ReplaySubject<SiteSettings>(1);

  siteName = this.getPropertyObservable("siteName");
  language = this.getPropertyObservable("language");
  displayLanguageSelect = this.getPropertyObservable("displayLanguageSelect");
  icon = this.getPropertyObservable("icon").pipe(
    filter((v) => !!v),
    delay(0),
  );
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
    this.icon.subscribe(async () => {
      const entity = await firstValueFrom(this.siteSettings);
      const imgUrl = await firstValueFrom(
        this.fileService.loadFile(entity, "icon"),
      );
      const favIcon: HTMLLinkElement = document.querySelector("#appIcon");
      favIcon.href = Object.values(imgUrl)[0];
    });
  }

  getPropertyObservable<P extends keyof SiteSettings>(
    property: P,
  ): Observable<SiteSettings[P]> {
    return this.siteSettings.pipe(
      map((s) => s[property]),
      distinctUntilChanged(),
    );
  }
}
