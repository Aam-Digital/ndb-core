import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs';
import {NoteModel} from '../note.model';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {FilterSelection} from '../../ui-helper/filter-selection/filter-selection';
import {WarningLevel} from '../../children/attendance/warning-level';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MatDialog} from '@angular/material/dialog';
import {SessionService} from '../../session/session.service';
import {MediaChange, MediaObserver} from '@angular/flex-layout';
import {NoteDetailComponent} from '../note-detail/note-detail.component';
import {NotesService} from '../notes.service';

@Component({
  selector: 'app-note-manager',
  templateUrl: './note-manager.component.html',
  styleUrls: ['./note-manager.component.scss']
})
export class NoteManagerComponent implements OnInit, AfterViewInit {

  watcher: Subscription;
  activeMediaQuery = '';
  entityList = new Array<NoteModel>();
  notesDataSource = new MatTableDataSource();

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  columnsToDisplay = ['date', 'subject', 'category', 'author', 'children'];

  columnGroups = {
    'standard' : ['date', 'subject', 'category', 'author', 'children'],
    'mobile' : ['date', 'subject', 'children']
  };

  filterString = '';

  followUpFS = new FilterSelection<NoteModel>('status', [
    { key: 'urgent', label: 'Urgent', filterFun: (n: NoteModel) => n.warningLevel === WarningLevel.URGENT },
    { key: 'follow-up', label: 'Needs Follow-Up',
      filterFun: (n: NoteModel) => n.warningLevel === WarningLevel.WARNING || n.warningLevel === WarningLevel.URGENT },
    { key: '', label: 'All', filterFun: (c: NoteModel) => true },
  ]);

  dateFS = new FilterSelection<NoteModel>('date', [
    { key: 'current-week', label: 'This Week',
      filterFun: (n: NoteModel) => n.date > this.getPreviousSunday(0) },
    { key: 'last-week', label: 'Since Last Week', filterFun: (n: NoteModel) => n.date > this.getPreviousSunday(1) },
    { key: '', label: 'All', filterFun: (c: NoteModel) => true },
  ]);

  filterSelections = [
    this.followUpFS,
    this.dateFS,
  ];

  categoryFS = new FilterSelection<NoteModel>('category', []);
  filterSelectionsDropdown = [
    this.categoryFS,
  ];

  constructor( // private entityMapper: EntityMapperService,
              private dialog: MatDialog,
              private sessionService: SessionService,
              private media: MediaObserver,
              private notesService: NotesService) { }

  ngOnInit() {

    // Receives the notes from the notes-service, sorts them and applies filter selections
    this.notesService.getNotes().subscribe(notes => {
      this.entityList = notes.sort((a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0) );
      this.applyFilterSelections();
    });

    this.displayColumnGroup('standard');
    this.watcher = this.media.media$.subscribe((change: MediaChange) => {
      if (change.mqAlias === 'xs' || change.mqAlias === 'sm') {
        console.log('smaller screen toggled');
        this.displayColumnGroup('mobile');
      }
    });
    this.initCategoryFilter();
  }

  displayColumnGroup(columnGroup: string) {

    this.columnsToDisplay = this.columnGroups[columnGroup];
  }

  private initCategoryFilter() {
    this.categoryFS.options = [
      { key: '', label: '', filterFun: (n: NoteModel) => true },
    ];

    NoteModel.INTERACTION_TYPES.forEach(t => {
      this.categoryFS.options.push({ key: t, label: t, filterFun: (n: NoteModel) => n.category === t });
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
    const newNote = new NoteModel(Date.now().toString());
    newNote.date = new Date();
    newNote.author = this.sessionService.getCurrentUser().name;

    this.showDetails(newNote);
  }

  showDetails(entity: NoteModel) {
    this.dialog.open(NoteDetailComponent, {width: '80%', data: {entity: entity}});
  }

}
