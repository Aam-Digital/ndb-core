import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityCreateButtonComponent } from "./entity-create-button.component";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { Angulartics2Module } from "angulartics2";
import { Entity } from "../../entity/model/entity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("EntityCreateButtonComponent", () => {
  let component: EntityCreateButtonComponent;
  let fixture: ComponentFixture<EntityCreateButtonComponent>;

  let mockAbility: any;

  beforeEach(async () => {
    mockAbility = {
      cannot: vi.fn(),
      on: vi.fn(),
    };
    mockAbility.on.mockReturnValue(() => null);

    await TestBed.configureTestingModule({
      imports: [
        EntityCreateButtonComponent,
        Angulartics2Module.forRoot(),
        FontAwesomeTestingModule,
      ],
      providers: [{ provide: EntityAbility, useValue: mockAbility }],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityCreateButtonComponent);
    component = fixture.componentInstance;

    component.entityType = Entity;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
