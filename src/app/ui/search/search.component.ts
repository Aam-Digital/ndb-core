import { Component, OnInit } from '@angular/core';
import {Database} from '../../database/database';
import {Child} from '../../children/child';
import {School} from '../../schools/school';
import {Entity} from '../../entity/entity';

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
      .then(queryResults => this.results = this.parseRows(queryResults.rows)
        .filter(r => r !== undefined)
        .sort((a, b) => this.sortResults(a, b))
      );
  }

  private parseRows(rows) {
    return rows.map(r => {
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
      });
  }

  private sortResults(a, b) {
    const entityComparison = this.compareEntityTypes(a, b);
    if (entityComparison === 0) {
      return a.toString().localeCompare(b.toString());
    } else {
      return entityComparison;
    }
  }

  private compareEntityTypes(a: Entity, b: Entity) {
    const e = [a, b];
    const t = [a.getType(), b.getType()];

    // special sorting for Child entities
    for (let i = 0; i < 2; i++) {
      if (e[i].getType() === Child.ENTITY_TYPE) {
        if ((e[i] as Child).isActive()) {
          // show first
          t[i] = '!' + t[i];
        } else {
          // show last
          t[i] = '\ufff0' + t[i];
        }
      }
    }

    return t[0].localeCompare(t[1]);
  }




  clickOption(optionElement) {
    // simulate a click on the EntityBlock inside the selected option element
    optionElement._element.nativeElement.children['0'].children['0'].click();
  }

}
