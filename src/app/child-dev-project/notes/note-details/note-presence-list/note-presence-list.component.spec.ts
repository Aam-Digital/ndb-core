import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotePresenceListComponent } from './note-presence-list.component';
import { ChildSelectComponent } from '../../../children/child-select/child-select.component';
import { ChildPresenceListComponent } from '../child-presence-list/child-presence-list.component';
import { MatTabsModule } from '@angular/material';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { EntitySchemaService } from 'app/core/entity/schema/entity-schema.service';
import { EntityMapperService } from 'app/core/entity/entity-mapper.service';

describe('NotePresenceListComponent', () => {
  let component: NotePresenceListComponent;
  let fixture: ComponentFixture<NotePresenceListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotePresenceListComponent,
        ChildSelectComponent,
        ChildPresenceListComponent,
      ],
      imports: [
        MatTabsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        FormsModule,
      ],
      providers: [
        EntitySchemaService,
        EntityMapperService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotePresenceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
