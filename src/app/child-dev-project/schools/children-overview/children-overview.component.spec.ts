import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ChildrenOverviewComponent } from "./children-overview.component";

describe("ChildrenOverviewComponent", () => {
  let component: ChildrenOverviewComponent;
  let fixture: ComponentFixture<ChildrenOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ChildrenOverviewComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
