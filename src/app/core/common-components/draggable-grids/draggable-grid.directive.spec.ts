import { DraggableGridDirective } from "./draggable-grid.directive";
import { CdkDropListGroup } from "@angular/cdk/drag-drop";

describe("DraggableGridDirective", () => {
  it("should create an instance", () => {
    const hostElement: CdkDropListGroup<any> = null; // provide a valid host element if available
    const directive = new DraggableGridDirective(hostElement);
    expect(directive).toBeTruthy();
  });
});
