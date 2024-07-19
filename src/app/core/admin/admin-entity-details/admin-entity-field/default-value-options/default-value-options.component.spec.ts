import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultValueOptionsComponent } from './default-value-options.component';

describe('DefaultValueOptionsComponent', () => {
  let component: DefaultValueOptionsComponent;
  let fixture: ComponentFixture<DefaultValueOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultValueOptionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DefaultValueOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
