import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250904191600_RemoveActivityEntity extends Migration {

  async up(): Promise<void> {
    // Remove the activities field from all Unit embeddables within Course documents
    const collection = this.getCollection('course');
    await collection.updateMany(
      { "units.activities": { $exists: true } },
      { $unset: { "units.$[].activities": "" } }
    );
  }

  async down(): Promise<void> {
    // Re-add empty activities array to all Unit embeddables within Course documents
    const collection = this.getCollection('course');
    await collection.updateMany(
      {},
      { $set: { "units.$[].activities": [] } }
    );
  }

}