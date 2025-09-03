import { defineConfig } from '@mikro-orm/mongodb'
import { MongoHighlighter } from '@mikro-orm/mongo-highlighter'
import * as dotenv from 'dotenv'

dotenv.config()

const { MONGO_USER, MONGO_PASS, MONGO_CLUSTER, MONGO_DB_NAME } = process.env

if (!MONGO_USER || !MONGO_PASS || !MONGO_CLUSTER || !MONGO_DB_NAME) {
  throw new Error('Missing environment variables for MongoDB connection')
}

const connectionString = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@${MONGO_CLUSTER}/${MONGO_DB_NAME}?retryWrites=true&w=majority`

export default defineConfig({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  dbName: MONGO_DB_NAME,
  clientUrl: connectionString,
  highlighter: new MongoHighlighter(),
  debug: true,
  migrations: {
    path: 'dist/migrations', 
    pathTs: 'src/migrations',
    glob: '!(*.d).{js,ts}',
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    dropTables: true,
    safe: false,
    emit: 'ts',
  },
  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
  },
})