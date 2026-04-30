import { TestBed } from "@angular/core/testing";
import { DeDuplicationModule } from "./de-duplication-module";
import { RoutedViewComponent } from "app/core/ui/routed-view/routed-view.component";
import { MockedTestingModule } from "app/utils/mocked-testing.module";

describe("DeDuplicationModule routes", () => {
  it("should register a review-duplicates route with RoutedViewComponent and ReviewDuplicates component", () => {
    const route = DeDuplicationModule.routes.find(
      (r) => r.path === "review-duplicates",
    );

    expect(route).toBeDefined();
    expect(route!.component).toBe(RoutedViewComponent);
    expect(route!.data).toEqual({ component: "ReviewDuplicates" });
  });

  it("should allow navigation when no unsaved changes exist", async () => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });

    const route = DeDuplicationModule.routes.find(
      (r) => r.path === "review-duplicates",
    );
    const guard = route!.canDeactivate![0] as () => Promise<boolean>;
    const result = await TestBed.runInInjectionContext(() => guard());

    expect(result).toBe(true);
  });
});
