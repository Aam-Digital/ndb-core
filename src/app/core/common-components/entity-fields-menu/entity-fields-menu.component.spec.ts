import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityFieldsMenuComponent } from "./entity-fields-menu.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityFormService } from "../entity-form/entity-form.service";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";

describe("EntityFieldsMenuComponent", () => {
  let component: EntityFieldsMenuComponent;
  let fixture: ComponentFixture<EntityFieldsMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityFieldsMenuComponent, FontAwesomeTestingModule],
      providers: [
        { provide: EntityFormService, useValue: null },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityFieldsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
