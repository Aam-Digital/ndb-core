import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminDefaultValueStaticComponent } from "./admin-default-value-static.component";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";

describe("AdminDefaultValueStaticComponent", () => {
  let component: AdminDefaultValueStaticComponent;
  let fixture: ComponentFixture<AdminDefaultValueStaticComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDefaultValueStaticComponent],
      providers: [
        {
          provide: EntitySchemaService,
          useValue: {
            valueToDatabaseFormat: (v) => v,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDefaultValueStaticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
