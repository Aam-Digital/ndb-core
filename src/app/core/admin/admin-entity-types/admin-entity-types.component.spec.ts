import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityTypesComponent } from "./admin-entity-types.component";
import {
  entityRegistry,
  EntityRegistry,
} from "../../entity/database-entity.decorator";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../entity/entity-mapper/mock-entity-mapper-service";

describe("AdminEntityTypesComponent", () => {
  let component: AdminEntityTypesComponent;
  let fixture: ComponentFixture<AdminEntityTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEntityTypesComponent],
      providers: [
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
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
