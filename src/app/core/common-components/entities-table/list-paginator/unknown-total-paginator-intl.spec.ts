import { MatPaginatorIntl } from "@angular/material/paginator";
import { UnknownTotalPaginatorIntl } from "./unknown-total-paginator-intl";

describe("UnknownTotalPaginatorIntl", () => {
  let delegate: MatPaginatorIntl;
  let intl: UnknownTotalPaginatorIntl;

  beforeEach(() => {
    delegate = new MatPaginatorIntl();
    delegate.itemsPerPageLabel = "items";
    delegate.nextPageLabel = "next";
    delegate.previousPageLabel = "prev";
    delegate.firstPageLabel = "first";
    delegate.lastPageLabel = "last";
    intl = new UnknownTotalPaginatorIntl(delegate);
  });

  it("should inherit the translated labels from the delegate", () => {
    expect(intl.itemsPerPageLabel).toBe("items");
    expect(intl.nextPageLabel).toBe("next");
    expect(intl.previousPageLabel).toBe("prev");
    expect(intl.firstPageLabel).toBe("first");
    expect(intl.lastPageLabel).toBe("last");
  });

  it("should delegate the range label when the total is known", () => {
    intl.hasUnknownTotalCount = false;

    expect(intl.getRangeLabel(0, 10, 11)).toBe(
      delegate.getRangeLabel(0, 10, 11),
    );
  });

  it("should mark the total as a lower bound with a trailing '+' when unknown", () => {
    intl.hasUnknownTotalCount = true;

    // page 0, pageSize 10, length 11 (10 shown + 1 probe) -> "1 - 10 of 10+"
    expect(intl.getRangeLabel(0, 10, 11)).toBe("1 - 10 of 10+");
  });

  it("should compute the '+' range for later pages", () => {
    intl.hasUnknownTotalCount = true;

    // page 1, pageSize 10, length 21 -> "11 - 20 of 20+"
    expect(intl.getRangeLabel(1, 10, 21)).toBe("11 - 20 of 20+");
  });

  it("should delegate the empty range even when total is marked unknown", () => {
    intl.hasUnknownTotalCount = true;

    expect(intl.getRangeLabel(0, 10, 0)).toBe(delegate.getRangeLabel(0, 10, 0));
  });
});
