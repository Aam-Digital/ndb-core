import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminTabsComponent } from "./admin-tabs.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { SimpleChange } from "@angular/core";

describe("AdminTabsComponent", () => {
  let component: AdminTabsComponent<any>;
  let fixture: ComponentFixture<AdminTabsComponent<any>>;

  let tabs: any[];

  beforeEach(async () => {
    tabs = [{ title: "Tab 1" }, { title: "Tab 2" }];

    await TestBed.configureTestingModule({
      imports: [
        AdminTabsComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTabsComponent);
    component = fixture.componentInstance;

    component.tabs = tabs;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should add new tab to config", () => {
    component.createTab();

    expect(component.tabs.length).toBe(3);
  });

  it("should detect whether tab title is 'title' or 'name' property", () => {
    // default
    testTabTitleDetection([], "title");

    testTabTitleDetection([{ name: "foo" }], "name");
    testTabTitleDetection([{ title: "bar" }], "title");
  });

  function testTabTitleDetection(
    tabs: any[],
    expectedTabTitleProperty: string,
  ) {
    component.tabs = tabs;
    component.ngOnChanges({ tabs: new SimpleChange(null, null, null) });
    expect(component.tabTitleProperty).toBe(expectedTabTitleProperty);
  }
});
