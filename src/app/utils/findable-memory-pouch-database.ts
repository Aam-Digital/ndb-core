import { MemoryPouchDatabase } from "../core/database/pouchdb/memory-pouch-database";

/**
 * An in-memory database that also supports {@link PouchDatabase.find}, so that
 * tests can exercise an entity type end-to-end through
 * `EntityMapperService.findType` -> `Database.find`.
 *
 * PouchDB's local Mango engine has no bookmark cursor, so the opaque bookmark
 * is the positional offset of the next unseen document. Callers only pass it
 * back unread, which is all the remote contract promises them.
 */
export class FindableMemoryPouchDatabase extends MemoryPouchDatabase {
  override async find(
    prefix = "",
    query = {},
    page?: { limit?: number; bookmark?: string },
    sort?: { prop?: string; dir?: "asc" | "desc" },
  ): Promise<{ docs: any[]; bookmark?: string }> {
    const skip = page?.bookmark ? Number(page.bookmark) : 0;
    const findOptions: PouchDB.Find.FindRequest<any> & { skip?: number } = {
      selector: {
        ...query,
        _id: { $lt: `${prefix}:￰`, $gte: `${prefix}:` },
      },
      skip,
    };
    if (Number.isInteger(page?.limit)) {
      findOptions.limit = page.limit;
    }

    const pouchDB = await this.getPouchDBOnceReady();
    if (sort?.prop) {
      // mirrors RemotePouchDatabase: the sort field needs an index, and the
      // type range moves into that index's partial selector
      const indexRes = await pouchDB.createIndex({
        index: {
          name: prefix + "_" + sort.prop,
          partial_filter_selector: {
            _id: findOptions.selector._id,
          },
          fields: [sort.prop],
        },
      });
      delete findOptions.selector._id;
      findOptions.sort = [{ [sort.prop]: sort.dir }];
      findOptions.use_index = indexRes["id"];
    }

    const res = await pouchDB.find(findOptions);
    return { docs: res.docs, bookmark: String(skip + res.docs.length) };
  }
}
