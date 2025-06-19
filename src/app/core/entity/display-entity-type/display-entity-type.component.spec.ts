import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayEntityTypeComponent } from "./display-entity-type.component";
import { EntityRegistry } from "../database-entity.decorator";

describe("DisplayEntityTypeComponent", () => {
  let component: DisplayEntityTypeComponent;
  let fixture: ComponentFixture<DisplayEntityTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayEntityTypeComponent],
      providers: [EntityRegistry],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayEntityTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
