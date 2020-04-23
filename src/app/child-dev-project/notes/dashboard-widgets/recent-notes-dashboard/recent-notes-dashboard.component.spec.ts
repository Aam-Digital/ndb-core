import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChildBlockComponent } from '../../../children/child-block/child-block.component';
import { ChildrenService } from '../../../children/children.service';
import { EntityModule } from '../../../../core/entity/entity.module';
import { RouterTestingModule } from '@angular/router/testing';
import { ChildPhotoService } from '../../../children/child-photo-service/child-photo.service';
import { RecentNotesDashboardComponent } from './recent-notes-dashboard.component';

describe('RecentNotesDashboardComponent', () => {
  let component: RecentNotesDashboardComponent;
  let fixture: ComponentFixture<RecentNotesDashboardComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(async(() => {
    mockChildrenService = jasmine.createSpyObj('mockChildrenService', ['getNotes']);

    TestBed.configureTestingModule({
      declarations: [
        RecentNotesDashboardComponent,
        ChildBlockComponent,
      ],
      imports: [
        MatIconModule,
        MatCardModule,
        MatTooltipModule,
        RouterTestingModule.withRoutes([]),
        EntityModule],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: ChildPhotoService, useValue: jasmine.createSpyObj(['getImage']) },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecentNotesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
