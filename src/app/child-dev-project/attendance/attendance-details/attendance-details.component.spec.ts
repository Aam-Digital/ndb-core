import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AttendanceDetailsComponent } from "./attendance-details.component";
import { ChildrenService } from "../../children/children.service";
import { AttendanceMonth } from "../model/attendance-month";
import { EntityModule } from "../../../core/entity/entity.module";
import { RouterTestingModule } from "@angular/router/testing";
import { of } from "rxjs";
import { Angulartics2Module } from "angulartics2";
import { AttendanceModule } from "../attendance.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Child } from "../../children/model/child";

describe("AttendanceDetailsComponent", () => {
  let component: AttendanceDetailsComponent;
  let fixture: ComponentFixture<AttendanceDetailsComponent>;

  beforeEach(async(() => {
    const att = new AttendanceMonth("test");
    att.month = new Date();

    TestBed.configureTestingModule({
      imports: [
        AttendanceModule,
        EntityModule,
        RouterTestingModule,
        Angulartics2Module.forRoot(),
        RouterTestingModule,
      ],
      providers: [
        {
          provide: ChildrenService,
          useValue: { getChild: () => of(new Child()) },
        },
        { provide: EntityMapperService, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
