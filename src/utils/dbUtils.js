import PouchDB from 'pouchdb';

export function getLegalDBName(input) {
  return encodeURIComponent(input.toLowerCase())
    .replace(/\./g, '%2E')
    .replace(/!/g, '%21')
    .replace(/~/g, '%7E')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\-/g, '%2D')
    .toLowerCase()
    .replace(/(%..)/g, esc => `(${esc.substr(1)})`);
}

export function getDbUrl(db) {
  if (db.user) {
    return `${db.protocol}${encodeURIComponent(db.user)}:${encodeURIComponent(db.password)}@${db.host}`;
  } else {
    return `${db.protocol}${db.host}`;
  }
};

const dbs = {};
export function getDb(dbUrl) {
  if (!dbs[dbUrl]) dbs[dbUrl] = new PouchDB(dbUrl);
  return dbs[dbUrl];
}
