import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonEditorComponent } from './json-editor.component';

describe('JsonEditorComponent', () => {
  let component: JsonEditorComponent;
  let fixture: ComponentFixture<JsonEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JsonEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
