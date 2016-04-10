/**
 * An implementation of this interface provides functions for direct database access.
 * The interface is compatible with PouchDB.
 * A `Database` instance is injected into the app through DatabaseManager.
 */
export abstract class Database {

    abstract get(id: string);
    abstract allDocs(options: any);
    abstract put(object: any);
    abstract remove(object: any);

    getAll(prefix = ""): any[] {
        return this.allDocs({include_docs: true, startkey: prefix, endkey: prefix + "\ufff0"});
    }
}
