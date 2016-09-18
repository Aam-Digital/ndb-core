/**
 * An implementation of this interface provides functions for direct database access.
 * The interface is an extension of the [PouchDB API](https://pouchdb.com/api.html).
 * A `Database` instance is injected into the app through `DatabaseManagerService`.
 */
export abstract class Database {

    abstract get(id: string): any;

    abstract allDocs(options?: any): any;

    abstract put(object: any): any;

    abstract remove(object: any): any;

    getAll(prefix = ''): any[] {
        return this.allDocs({include_docs: true, startkey: prefix, endkey: prefix + '\ufff0'});
    }
}
