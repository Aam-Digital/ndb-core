import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Note } from '../model/note';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { NoteDetailsComponent } from '../note-details/note-details.component';
import { InteractionTypes } from '../interaction-types.enum';
import { MatPaginator } from '@angular/material/paginator';
import { WarningLevel } from '../../warning-level';
import { EntityMapperService } from '../../../core/entity/entity-mapper.service';
import { FilterSelection } from '../../../core/filter/filter-selection/filter-selection';
import { SessionService } from '../../../core/session/session-service/session.service';

@Component({
  selector: 'app-notes-manager',
  templateUrl: './notes-manager.component.html',
  styleUrls: ['./notes-manager.component.scss'],
})
export class NotesManagerComponent implements OnInit, AfterViewInit {

  watcher: Subscription;
  activeMediaQuery = '';
  entityList = new Array<Note>();
  notesDataSource = new MatTableDataSource();

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  columnsToDisplay = ['date', 'subject', 'category', 'author', 'children'];

  columnGroups = {
    'standard' : ['date', 'subject', 'category', 'author', 'children'],
    'mobile' : ['date', 'subject', 'children'],
  };

  filterString = '';

  followUpFS = new FilterSelection<Note>('status', [
    { key: 'urgent', label: 'Urgent', filterFun: (n: Note) => n.warningLevel === WarningLevel.URGENT },
    { key: 'follow-up', label: 'Needs Follow-Up',
      filterFun: (n: Note) => n.warningLevel === WarningLevel.WARNING || n.warningLevel === WarningLevel.URGENT },
    { key: '', label: 'All', filterFun: () => true },
  ]);

  dateFS = new FilterSelection<Note>('date', [
    { key: 'current-week', label: 'This Week',
      filterFun: (n: Note) => n.date > this.getPreviousSunday(0) },
    { key: 'last-week', label: 'Since Last Week', filterFun: (n: Note) => n.date > this.getPreviousSunday(1) },
    { key: '', label: 'All', filterFun: () => true },
  ]);

  filterSelections = [
    this.followUpFS,
    this.dateFS,
  ];

  categoryFS = new FilterSelection<Note>('category', []);
  filterSelectionsDropdown = [
    this.categoryFS,
  ];

  constructor(private dialog: MatDialog,
              private sessionService: SessionService,
              private media: MediaObserver,
              private entityMapperService: EntityMapperService) {}

  ngOnInit() {
    // activate default filter to current week
    this.dateFS.selectedOption = this.dateFS.options[0].key;

    this.entityMapperService.loadType<Note>(Note).then(notes => {
      this.sortAndAdd(notes);
    });

    this.displayColumnGroup('standard');
    this.watcher = this.media.media$.subscribe((change: MediaChange) => {
      if (change.mqAlias === 'xs' || change.mqAlias === 'sm') {
        console.log('smaller screen toggled');
        this.displayColumnGroup('mobile');
      }
    });

    this.initCategoryFilter();
    this.notesDataSource.paginator = this.paginator;
  }

  private sortAndAdd(newNotes: Note[]) {
    newNotes.forEach(newNote => {
      this.entityList.push(newNote);
    });
    this.entityList.sort((a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0) );
    this.applyFilterSelections();
  }

  displayColumnGroup(columnGroup: string) {

    this.columnsToDisplay = this.columnGroups[columnGroup];
  }

  private initCategoryFilter() {
    this.categoryFS.options = [
      { key: '', label: '', filterFun: () => true },
    ];

    Object.values(InteractionTypes).forEach(interaction => {
      this.categoryFS.options.push({
        key: interaction,
        label: interaction,
        filterFun: (note: Note) => {
          return interaction === InteractionTypes.NONE ? true : note.category === interaction;
        },
      });
    });

    this.applyFilterSelections();
  }

  ngAfterViewInit() {
    this.notesDataSource.sort = this.sort;
  }

  private getPreviousSunday(weeksBack: number) {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day - 7 * weeksBack; // adjust when day is sunday
    return new Date(today.setDate(diff));
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.notesDataSource.filter = filterValue;
  }

  applyFilterSelections() {
    let filteredData = this.entityList;

    this.filterSelections.forEach(f => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
     });
     this.filterSelectionsDropdown.forEach(f => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });

    this.notesDataSource.data = filteredData;
  }


  addNoteClick() {
    const newNote = new Note(Date.now().toString());
    newNote.date = new Date();
    newNote.author = this.sessionService.getCurrentUser().name;

    const noteDialogRef = this.showDetails(newNote);
    noteDialogRef.afterClosed()
      .subscribe(val => {
        this.entityList = [val].concat(this.entityList);
        this.applyFilterSelections();
      });
  }

  showDetails(entity: Note) {
    return this.dialog.open(NoteDetailsComponent, {width: '80%', data: {entity: entity}});
  }
}
