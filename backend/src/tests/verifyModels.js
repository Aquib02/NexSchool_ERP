import mongoose from 'mongoose';
import * as Models from '../models/index.js';

console.log('----------------------------------------------------');
console.log('School ERP - Mongoose Schema Compilation & Integrity Check');
console.log('----------------------------------------------------');

const modelNames = Object.keys(Models).filter((k) => k !== 'default');
let errorCount = 0;

console.log(`Total Models to verify: ${modelNames.length}\n`);

modelNames.forEach((name) => {
  try {
    const Model = Models[name];
    if (!Model || !Model.schema) {
      throw new Error(`Model ${name} is not a valid Mongoose model or schema is missing.`);
    }

    const pathCount = Object.keys(Model.schema.paths).length;
    const indexCount = Model.schema.indexes().length;

    console.log(`✓ [VALID] ${name.padEnd(24)} | Fields: ${String(pathCount).padStart(2)} | Indexes: ${String(indexCount).padStart(2)}`);
  } catch (err) {
    errorCount++;
    console.error(`✗ [ERROR] Model ${name}:`, err.message);
  }
});

console.log('----------------------------------------------------');
if (errorCount === 0) {
  console.log(`SUCCESS: All ${modelNames.length} Mongoose models compiled and validated cleanly!`);
  process.exit(0);
} else {
  console.error(`FAILURE: ${errorCount} model(s) failed validation.`);
  process.exit(1);
}
