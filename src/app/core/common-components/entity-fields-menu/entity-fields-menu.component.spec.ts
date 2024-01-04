import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityFieldsMenuComponent } from "./entity-fields-menu.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("EntityFieldsMenuComponent", () => {
  let component: EntityFieldsMenuComponent;
  let fixture: ComponentFixture<EntityFieldsMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityFieldsMenuComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityFieldsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
