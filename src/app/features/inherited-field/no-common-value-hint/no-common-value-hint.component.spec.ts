import { TestBed } from "@angular/core/testing";
import { NoCommonValueReason } from "#src/app/core/default-values/default-value-service/default-value.service";
import { NoCommonValueHintComponent } from "./no-common-value-hint.component";

describe("NoCommonValueHintComponent", () => {
  it.each([
    ["unavailable", "could not be loaded"],
    ["conflict", "have no value in common"],
  ] as [NoCommonValueReason, string][])(
    "explains the reason '%s'",
    (reason, expectedText) => {
      const fixture = TestBed.createComponent(NoCommonValueHintComponent);
      fixture.componentRef.setInput("reason", reason);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(expectedText);
    },
  );
});
