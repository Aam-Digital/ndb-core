import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminTabsComponent } from "./admin-tabs.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

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

    fixture.componentRef.setInput("tabs", tabs);

    fixture.detectChanges();
  });

  it("should add new tab to config", () => {
    component.createTab();

    expect(component.tabs().length).toBe(3);
  });

  it("should show a renamed tab's title on the non-selected tab label", () => {
    tabs[1].title = "Renamed";
    fixture.detectChanges();

    // tab 0 is selected and renders the editable header instead of plain text
    expect(labelTexts()[1]).toBe("Renamed");
  });

  /** the rendered text of every tab label */
  function labelTexts(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll(".drop-item")).map(
      (el: HTMLElement) => el.textContent.trim(),
    );
  }

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
    fixture.componentRef.setInput("tabs", tabs);
    fixture.detectChanges();
    expect(component.tabTitleProperty()).toBe(expectedTabTitleProperty);
  }
});
