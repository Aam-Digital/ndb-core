import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadProgressComponent } from './download-progress.component';

describe('DownloadProgressComponent', () => {
  let component: DownloadProgressComponent;
  let fixture: ComponentFixture<DownloadProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadProgressComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownloadProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
