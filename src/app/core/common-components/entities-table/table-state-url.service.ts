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
    const queryParams = { ...this.route.snapshot.queryParams };
    for (const key of Object.keys(params)) {
      const value = params[key];
      if (value == null || value === "") {
        delete queryParams[key];
      } else {
        queryParams[key] = value;
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
   * Deprecated: single key-value param update. Use updateUrlParams instead.
   */
  updateUrlParam(key: string, value: string, replaceUrl = true) {
    this.updateUrlParams({ [key]: value }, replaceUrl);
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
