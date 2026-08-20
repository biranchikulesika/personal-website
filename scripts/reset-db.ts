import { resetDatabase } from '../lib/data/mock-db';

const db = resetDatabase();

console.log('Mock database reset.');
console.log(`- media: ${db.media.length}`);
console.log(`- storage: ${db.storage.length}`);
console.log(`- userRoles: ${db.userRoles.length}`);
