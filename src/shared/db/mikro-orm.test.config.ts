import { defineConfig } from '@mikro-orm/mongodb';
import { User } from '../../models/user/user.entity.js';
import { Student } from '../../models/student/student.entity.js';
import { Professor } from '../../models/professor/professor.entity.js';
import { Institution } from '../../models/institution/institution.entity.js';
import { Course } from '../../models/course/course.entity.js';
import { CourseType } from '../../models/courseType/courseType.entity.js';
import { Enrollement } from '../../models/Enrollement/enrollement.entity.js';
import { Appeal } from '../../models/appeal/appeal.entity.js';

/**
 * MikroORM configuration for testing environment
 * Uses MongoDB Memory Server and allows global context to simplify tests
 * Entities are explicitly imported to avoid issues with ESM
 */
export default defineConfig({
  clientUrl: process.env.MONGO_URI_TEST,
  dbName: 'test-db',

  // Allow using EntityManager without RequestContext in tests
  allowGlobalContext: true,

  // Silence logs to keep test output clean
  debug: false,

  // Explicitly imported entities (no discovery)
  entities: [
    User,
    Student,
    Professor,
    Institution,
    Course,
    CourseType,
    Enrollement,
    Appeal,
  ],
});
