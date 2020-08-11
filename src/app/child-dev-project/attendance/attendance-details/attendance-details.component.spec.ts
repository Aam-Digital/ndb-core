import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AttendanceDetailsComponent } from "./attendance-details.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Database } from "../../../core/database/database";
import { MockDatabase } from "../../../core/database/mock-database";
import { ChildrenService } from "../../children/children.service";
import { AttendanceMonth } from "../model/attendance-month";
import { EntityModule } from "../../../core/entity/entity.module";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildPhotoService } from "../../children/child-photo-service/child-photo.service";
import { of } from "rxjs";
import { ChildrenModule } from "../../children/children.module";
import { Angulartics2Module } from 'angulartics2';

describe("AttendanceDetailsComponent", () => {
  let component: AttendanceDetailsComponent;
  let fixture: ComponentFixture<AttendanceDetailsComponent>;

  beforeEach(async(() => {
    const att = new AttendanceMonth("test");
    att.month = new Date();

    TestBed.configureTestingModule({
      imports: [ChildrenModule, EntityModule, RouterTestingModule, Angulartics2Module.forRoot(), RouterTestingModule],
      providers: [
        { provide: Database, useClass: MockDatabase },
        { provide: MatDialogRef, useValue: { beforeClosed: () => of({}) } },
        { provide: MAT_DIALOG_DATA, useValue: { entity: att } },
        { provide: ChildrenService, useClass: ChildrenService },
        {
          provide: ChildPhotoService,
          useValue: jasmine.createSpyObj(["getImage"]),
        },
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
