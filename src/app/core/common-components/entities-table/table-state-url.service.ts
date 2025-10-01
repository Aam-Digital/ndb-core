import { Injectable, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

/**
 * Service to persist and restore table sort and filter state via URL query params.
 */
@Injectable({ providedIn: "root" })
export class TableStateUrlService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: "merge",
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
   * Update a filter param in the URL (for filter components).
   * If value is empty or null, removes the param.
   */
  updateFilterParam(key: string, value: string, replaceUrl = false) {
    this.updateUrlParams({ [key]: value }, replaceUrl);
  }

  /**
   * Get all filter params from the URL (excluding sortBy/sortOrder).
   */
  getFilterParams(): Record<string, string> {
    const params = this.getAllUrlParams();
    // Remove sortBy and sortOrder, keep only filter params
    delete params["sortBy"];
    delete params["sortOrder"];
    return params;
  }

  /**
   * Remove all filter params from the URL (for clear all filters).
   * Accepts a list of filter keys to remove.
   */
  clearFilterParams(filterKeys: string[], replaceUrl = false) {
    const queryParams = { ...this.route.snapshot.queryParams };
    for (const key of filterKeys) {
      delete queryParams[key];
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: "merge",
      ...(replaceUrl ? { replaceUrl: true } : {}),
    });
  }
}
