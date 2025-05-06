import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminDefaultValueUpdatedComponent } from "./admin-default-value-updated.component";
import { AutomatedStatusUpdateConfigService } from "../automated-status-update-config-service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";

describe("AdminDefaultValueUpdatedComponent", () => {
  let component: AdminDefaultValueUpdatedComponent;
  let fixture: ComponentFixture<AdminDefaultValueUpdatedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDefaultValueUpdatedComponent],
      providers: [
        AutomatedStatusUpdateConfigService,
        EntityRegistry,
        { provide: EntityMapperService, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDefaultValueUpdatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
