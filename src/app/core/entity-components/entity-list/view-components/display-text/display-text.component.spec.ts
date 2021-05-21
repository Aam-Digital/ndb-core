import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DisplayTextComponent } from "./display-text.component";
import { Child } from "../../../../../child-dev-project/children/model/child";

describe("DisplayTextComponent", () => {
  let component: DisplayTextComponent;
  let fixture: ComponentFixture<DisplayTextComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DisplayTextComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayTextComponent);
    component = fixture.componentInstance;
    component.onInitFromDynamicConfig({ entity: new Child(), id: "name" });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
