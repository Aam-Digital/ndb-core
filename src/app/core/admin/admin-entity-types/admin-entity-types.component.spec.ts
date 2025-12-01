import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityTypesComponent } from "./admin-entity-types.component";
import {
  entityRegistry,
  EntityRegistry,
} from "../../entity/database-entity.decorator";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AdminEntityTypesComponent", () => {
  let component: AdminEntityTypesComponent;
  let fixture: ComponentFixture<AdminEntityTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEntityTypesComponent, FontAwesomeTestingModule],
      providers: [
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: EntityMapperService,
          useValue: jasmine.createSpyObj(["load"]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEntityTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
