import { MatPaginatorIntl } from "@angular/material/paginator";

/**
 * A {@link MatPaginatorIntl} that indicates an unknown (lower-bound) total in the
 * range label, e.g. "1 - 10 of 10+" instead of "1 - 10 of 11".
 *
 * This is used together with the server-side `PaginatedDataSource`, where the
 * full number of matching entities is not known - only whether at least one
 * more record exists beyond the current page.
 *
 * All other labels (and the exact-total range label) are delegated to the
 * app-wide {@link MatPaginatorIntl} so translations are preserved.
 */
export class UnknownTotalPaginatorIntl extends MatPaginatorIntl {
  /** When true, the range label shows the total as a lower bound (with a trailing "+"). */
  hasUnknownTotalCount = false;

  constructor(private readonly delegate: MatPaginatorIntl) {
    super();
    // inherit the translated labels from the app-wide paginator intl
    this.itemsPerPageLabel = delegate.itemsPerPageLabel;
    this.nextPageLabel = delegate.nextPageLabel;
    this.previousPageLabel = delegate.previousPageLabel;
    this.firstPageLabel = delegate.firstPageLabel;
    this.lastPageLabel = delegate.lastPageLabel;
  }

  override getRangeLabel = (
    page: number,
    pageSize: number,
    length: number,
  ): string => {
    if (!this.hasUnknownTotalCount || length === 0 || pageSize === 0) {
      return this.delegate.getRangeLabel(page, pageSize, length);
    }

    const startIndex = page * pageSize;
    const endIndex =
      startIndex < length
        ? Math.min(startIndex + pageSize, length)
        : startIndex + pageSize;
    return $localize`:@@paginator.rangeOfUnknownTotalLabel:${
      startIndex + 1
    } - ${endIndex} of ${length - 1}+`;
  };
}
