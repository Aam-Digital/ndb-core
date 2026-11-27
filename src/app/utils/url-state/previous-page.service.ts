import { inject, Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { getPathOfUrl } from "../utils";

/**
 * Remembers the page the user came from, e.g. the list that a record was opened from.
 * Its URL holds the filters and sort the user had set (see `UrlStateService`), so going back
 * to it restores them.
 *
 * A page is identified by its path: navigations that only change the query params of the
 * current page (a selected tab, a filter) do not count as a new page.
 */
@Injectable({ providedIn: "root" })
export class PreviousPageService {
  private readonly router = inject(Router);

  private currentUrl = this.router.url;
  private previousPageUrl: string | undefined;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects;
        if (getPathOfUrl(url) !== getPathOfUrl(this.currentUrl)) {
          this.previousPageUrl = this.currentUrl;
        }
        this.currentUrl = url;
      });
  }

  /** The URL, including its query params, of the page before the current one (if any). */
  getPreviousPageUrl(): string | undefined {
    return this.previousPageUrl;
  }
}
