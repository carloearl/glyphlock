import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync('src/pages/NUPSOwner.jsx', 'utf8');
const block = source.slice(source.indexOf('const { data: transactions'));
const expression = block.match(/queryFn: ([\s\S]*?),\n    enabled:/)[1];
function query(entity) { return Function('base44', `return (${expression});`)({entities:{POSTransaction:entity}})(); }
test('owner transaction query returns an array rather than an SDK cursor page', async () => {
 const rows = [{id:'real-sale',mode:'REAL'}];
 const entity = {
  list: async (...args) => typeof args[0] === 'object' ? {items:rows,next_cursor:null} : rows,
  filter: async (criteria,...args) => typeof args[0] === 'object' ? {items:rows,next_cursor:null} : rows.filter(row => row.mode === criteria.mode),
 };
 const result = await query(entity);
 assert.ok(Array.isArray(result), 'owner renderer requires an array, not the SDK options cursor envelope');
 assert.equal(result.filter(row => row.mode === 'REAL').length,1);
});
test('owner query requests REAL records and retains server errors', async () => {
 let requested;
 const rows = await query({filter:async criteria=>{requested=criteria;return [];},list:async()=>[]});
 assert.equal(requested?.mode,'REAL');
 assert.deepEqual(rows,[]);
 await assert.rejects(query({filter:async()=>{throw new Error('Access denied');},list:async()=>[]}),/Access denied/);
});
