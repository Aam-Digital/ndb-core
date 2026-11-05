import { Injectable, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

/**
 * Service to persist and restore view state (filters, sort, selected tab, ...) via URL query params.
 *
 * The service does not know what a param means: each owner reads and writes its own keys.
 * To keep the keys of different owners apart:
 * - filters use the id of the filter, i.e. usually a field id chosen in the config
 *   (also used by links into a list, e.g. from dashboards)
 * - all other view state (sort, selected tab, ...) uses keys starting with "_" (e.g. `_sortBy`).
 *   Custom field ids cannot start with "_" (the admin UI does not allow it, and CouchDB reserves
 *   such top-level properties), so such a key never collides with a filter.
 *   Only the built-in `_id` and `_rev` start with "_": do not use these as keys of view state.
 */
@Injectable({ providedIn: "root" })
export class UrlStateService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /**
   * Update a query param in the URL (without reloading the page).
   */
  updateUrlParams(
    params: Record<string, string | null | undefined>,
    replaceUrl = true,
  ) {
    const MAX_URL_LENGTH = 2000;
    let queryParams = { ...this.route.snapshot.queryParams };
    for (const key of Object.keys(params)) {
      const value = params[key];
      if (value == null || value === "") {
        delete queryParams[key];
      } else {
        queryParams[key] = value;
      }
    }
    let potentialUrl = this.router
      .createUrlTree([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: "merge",
      })
      .toString();
    if (potentialUrl.length > MAX_URL_LENGTH) {
      let longestKey: string | null = null;
      let maxLength = 0;
      Object.keys(queryParams).forEach((key) => {
        if (queryParams[key] && queryParams[key].length > maxLength) {
          longestKey = key;
          maxLength = queryParams[key].length;
        }
      });
      if (longestKey) {
        delete queryParams[longestKey];
      } else {
        // fallback: remove the last added param
        const lastKey = Object.keys(params)[Object.keys(params).length - 1];
        delete queryParams[lastKey];
      }
    }
    this.navigateWithParams(queryParams, replaceUrl);
  }

  /**
   * Helper to navigate with given query params and replaceUrl option.
   */
  private navigateWithParams(
    queryParams: Record<string, any>,
    replaceUrl: boolean,
  ) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      ...(replaceUrl ? { replaceUrl: true } : {}),
    });
  }

  /**
   * Get a query param value from the URL.
   */
  getUrlParam(key: string): string | null {
    return this.route.snapshot.queryParamMap.get(key);
  }

  /**
   * Get all query params from the URL.
   */
  getAllUrlParams(): Record<string, string> {
    return { ...this.route.snapshot.queryParams };
  }

  /**
   * Remove the given query params from the URL.
   */
  removeUrlParams(keys: string[], replaceUrl = true) {
    const queryParams = this.getAllUrlParams();
    for (const key of keys) {
      delete queryParams[key];
    }
    this.navigateWithParams(queryParams, replaceUrl);
  }
}
