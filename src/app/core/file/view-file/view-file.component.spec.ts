import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ViewFileComponent } from "./view-file.component";
import { FileService } from "../file.service";

describe("ViewFileComponent", () => {
  let component: ViewFileComponent;
  let fixture: ComponentFixture<ViewFileComponent>;
  let mockFileService: jasmine.SpyObj<FileService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewFileComponent],
      providers: [{ provide: FileService, useValue: mockFileService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
