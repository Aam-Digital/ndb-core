/**
 * Based on a SO-Answer
 */
import { MatPaginatorIntl } from "@angular/material/paginator";

const matRangeLabelIntl = (page: number, pageSize: number, length: number) => {
  if (length === 0 || pageSize === 0) {
    return $localize`:@@paginator.zeroRange:0 in ${length}`;
  }
  length = Math.max(length, 0);
  const startIndex = page * pageSize;

  // If the start index exceeds the list length, do not try and fix the end index to the end.
  const endIndex =
    startIndex < length
      ? Math.min(startIndex + pageSize, length)
      : startIndex + pageSize;
  return $localize`:@@paginator.rangeOfLabel:${
    startIndex + 1
  } - ${endIndex} of ${length}`;
};

export function TranslatableMatPaginator() {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = $localize`:@@paginator.displayPerPage:Items per page`;
  paginatorIntl.nextPageLabel = $localize`:@@paginator.nextPage:Next page`;
  paginatorIntl.previousPageLabel = $localize`:@@paginator.prevPage:Prev page`;
  paginatorIntl.firstPageLabel = $localize`:@@paginator.firstPage:First page`;
  paginatorIntl.lastPageLabel = $localize`:@@paginator.lastPage:Last page`;
  paginatorIntl.getRangeLabel = matRangeLabelIntl;

  return paginatorIntl;
}
