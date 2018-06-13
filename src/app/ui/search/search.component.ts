import { Component, OnInit } from '@angular/core';
import {Database} from '../../database/database';
import {Child} from '../../children/child';
import {School} from '../../schools/school';

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
    // `emit(x)` to add x as a key to the index that can be searched
    const searchMapFunction = 'function searchMapFunction (doc) {' +
'if (doc.hasOwnProperty("name")) {doc.name.toLowerCase().split(" ").forEach(word => emit(word));}' +
'if (doc.hasOwnProperty("entityId")) { emit(doc.entityId); }' +
'if (doc.hasOwnProperty("projectNumber")) { emit(doc.projectNumber); }  }';

    const designDoc = {
      _id: '_design/search_index',
      views: {
        by_name: {
          map: searchMapFunction
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
            if (r.doc._id.startsWith(Child.ENTITY_TYPE + ':')) {
              resultEntity = new Child(r.doc.entityId);
            } else if (r.doc._id.startsWith(School.ENTITY_TYPE + ':')) {
              resultEntity = new School(r.doc.entityId);
            } else {
              return;
            }

            resultEntity.load(r.doc);
            return resultEntity;
          })
          .filter(r => r !== undefined)
          .sort(this.sortResults);
      });
  }

  private sortResults(a, b) {
    if (a.getType() === Child.ENTITY_TYPE) {
      if (!a.isActive()) {
        // inactive always last
        return 1;
      } else if (b.getType() === Child.ENTITY_TYPE) {
        return a.name.localeCompare(b.name);
      } else {
        return -1;
      }
    } else {
      if (b.getType() === Child.ENTITY_TYPE) {
        return 1;
      } else {
        return a.getType().localeCompare(b.getType());
      }
    }
  }

  clickOption(optionElement) {
    // simulate a click on the EntityBlock inside the selected option element
    optionElement._element.nativeElement.children['0'].children['0'].click();
  }

}
