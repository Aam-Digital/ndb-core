import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityPanelComponentComponent } from "./admin-entity-panel-component.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";

describe("AdminEntityPanelComponentComponent", () => {
  let component: AdminEntityPanelComponentComponent;
  let fixture: ComponentFixture<AdminEntityPanelComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEntityPanelComponentComponent],
      providers: [EntityRegistry],
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
