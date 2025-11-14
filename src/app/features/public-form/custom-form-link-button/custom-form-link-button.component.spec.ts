import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CustomFormLinkButtonComponent } from "./custom-form-link-button.component";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EntityConfigService } from "#src/app/core/entity/entity-config.service";

describe("CustomFormLinkButtonComponent", () => {
  let component: CustomFormLinkButtonComponent;
  let fixture: ComponentFixture<CustomFormLinkButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomFormLinkButtonComponent],
      providers: [
        {
          provide: EntityMapperService,
          useValue: jasmine.createSpyObj(["load"]),
        },
        {
          provide: EntityRegistry,
          useValue: jasmine.createSpyObj(["get"]),
        },
        {
          provide: EntityConfigService,
          useValue: jasmine.createSpyObj(["getEntityConfig"]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomFormLinkButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
