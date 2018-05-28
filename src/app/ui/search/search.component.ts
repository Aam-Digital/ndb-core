import { Component, OnInit } from '@angular/core';
import {Database} from '../../database/database';
import {Child} from '../../children/child';
import {School} from '../../schools/schoolsShared/school';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  results;
  searchText = '';

  constructor(private db: Database) { }

  ngOnInit() {
    this.createSearchIndex();
  }

  private createSearchIndex() {
    // defined to avoid Typescript error. Actually `emit` is provided by pouchDB to the `map` function
    const emit = (x) => {};

    const designDoc = {
      _id: '_design/search_index',
      views: {
        by_name: {
          map: function (doc) {
            if (doc.hasOwnProperty('name')) {
              doc.name.toLowerCase().split(' ').forEach(word => emit(word));
            }
            if (doc.hasOwnProperty('entityId')) {
              emit(doc.entityId);
            }
            if (doc.hasOwnProperty('pn')) {
              emit(doc.pn);
            }
          }.toString()
        }
      }
    };

    this.db.saveDatabaseIndex(designDoc);
  }


  search() {
    this.searchText = this.searchText.toLowerCase();
    this.db.query('search_index/by_name', {startkey: this.searchText, endkey: this.searchText + '\ufff0', include_docs: true})
      .then(queryResults => {
        this.results = queryResults.rows
          .map(r => {
            let resultEntity;
            if (!r.doc.hasOwnProperty('type')) {
              return;
            }
            switch (r.doc.type) {
              case ('Child'): {
                resultEntity = new Child(r.doc.entityId);
                break;
              }
              case ('School'): {
                resultEntity = new School(r.doc.entityId);
                break;
              }
              default: {
                return;
              }
            }
            Object.assign(resultEntity, r.doc);
            return resultEntity;
          })
          .filter(r => r !== undefined);
      });
  }

  clickOption(optionElement) {
    // simulate a click on the EntityBlock inside the selected option element
    optionElement._element.nativeElement.children['0'].children['0'].click();
  }

}
