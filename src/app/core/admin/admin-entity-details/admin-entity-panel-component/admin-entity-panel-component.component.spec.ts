import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityPanelComponentComponent } from "./admin-entity-panel-component.component";

describe("AdminEntityPanelComponentComponent", () => {
  let component: AdminEntityPanelComponentComponent;
  let fixture: ComponentFixture<AdminEntityPanelComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEntityPanelComponentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEntityPanelComponentComponent);
    component = fixture.componentInstance;

    component.config = {
      component: "SomeComponent",
    };

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
