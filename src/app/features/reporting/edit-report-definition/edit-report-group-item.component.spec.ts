import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EditReportGroupItemComponent } from "./edit-report-group-item.component";
import { ReportDefinitionUiNode } from "./report-definition-ui-node";

function create(node: ReportDefinitionUiNode): {
  component: EditReportGroupItemComponent;
  fixture: ComponentFixture<EditReportGroupItemComponent>;
} {
  const fixture = TestBed.createComponent(EditReportGroupItemComponent);
  fixture.componentRef.setInput("node", node);
  fixture.detectChanges();
  return { component: fixture.componentInstance, fixture };
}

describe("EditReportGroupItemComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditReportGroupItemComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();
  });

  it("distinguishes query nodes from group nodes", () => {
    expect(create({ uniqueId: "q", query: "" }).component.isGroup()).toBe(
      false,
    );
    expect(
      create({ uniqueId: "g", groupTitle: "G", items: [] }).component.isGroup(),
    ).toBe(true);
  });

  it("updates the query text of a query node", () => {
    const { component } = create({ uniqueId: "q", query: "" });

    component.setQuery("SELECT 1");

    expect(component.node().query).toBe("SELECT 1");
  });

  it("adds a query and a sub-group into a group node", () => {
    const { component } = create({ uniqueId: "g", groupTitle: "G", items: [] });

    component.addQuery();
    component.addSubGroup();

    expect(component.node().items.length).toBe(2);
    expect(component.node().items[0].query).toBe("");
    expect(component.node().items[1].items).toEqual([]);
  });

  it("removes a child by reference", () => {
    const child = { uniqueId: "c", query: "q" };
    const { component } = create({
      uniqueId: "g",
      groupTitle: "G",
      items: [child],
    });

    component.removeChild(child);

    expect(component.node().items).toEqual([]);
  });
});
