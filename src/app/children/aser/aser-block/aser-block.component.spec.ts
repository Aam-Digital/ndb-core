import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AserBlockComponent } from './aser-block.component';

describe('AserBlockComponent', () => {
  let component: AserBlockComponent;
  let fixture: ComponentFixture<AserBlockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AserBlockComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AserBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
