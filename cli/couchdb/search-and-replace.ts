import type { Couchdb } from "../lib/couchdb-client.js";

export async function searchEntities(
  couchdb: Couchdb,
  searchString: string,
  type: string,
): Promise<string[]> {
  const docs = (await couchdb.getAll(type)) as Array<{ _id: string }>;
  const regex = new RegExp(searchString);
  return docs
    .filter((doc) => regex.test(JSON.stringify(doc)))
    .map((doc) => doc._id);
}

export async function editEntities(
  couchdb: Couchdb,
  searchString: string,
  replaceString: string,
  type: string,
  dryRun: boolean,
): Promise<{ _id: string }[]> {
  const docs = (await couchdb.getAll(type)) as Array<{ _id: string }>;
  const testRegex = new RegExp(searchString);
  const replaceRegex = new RegExp(searchString, "g");
  const matched = docs.filter((doc) => testRegex.test(JSON.stringify(doc)));

  if (dryRun) {
    return matched.map((doc) => ({ _id: doc._id }));
  }

  const transformed = matched.map((doc) => {
    const replaced = JSON.stringify(doc).replace(replaceRegex, replaceString);
    return { _id: doc._id, body: JSON.parse(replaced) };
  });

  const results: { _id: string }[] = [];
  for (const doc of transformed) {
    await couchdb.put(`/app/${doc._id}`, doc.body);
    results.push({ _id: doc._id });
  }
  return results;
}
