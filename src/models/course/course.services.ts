import { EntityManager } from '@mikro-orm/core'
import { Course } from './course.entity.js'
import { CreateCourseType, UpdateCourseType } from './course.schemas.js'
import { Professor } from '../professor/professor.entity.js'
import { CourseType } from '../courseType/courseType.entity.js'
import { Logger } from 'pino'

export class CourseService {
  private em: EntityManager
  private logger: Logger

  constructor(em: EntityManager, logger: Logger) {
    this.em = em
    this.logger = logger.child({ context: { service: 'CourseService' } })
  }

  public async create(
    courseData: CreateCourseType,
    professorId: string
  ): Promise<Course> {
    this.logger.info({ name: courseData.name }, 'Creating new course.')

    const { courseTypeId, units, ...topLevelData } = courseData

    // Create the course entity. It's important to provide default values for properties
    // like 'isFree' and 'units' here to satisfy TypeScript's strict type check,
    // as it doesn't infer the defaults from the class definition in this context.
    const course = this.em.create(Course, {
      ...topLevelData,
      isFree: topLevelData.isFree ?? true,
      units: [], // Start with an empty array. We'll assign the real units below if they exist.
      courseType: this.em.getReference(CourseType, courseTypeId),
      professor: this.em.getReference(Professor, professorId),
    })

    // If the payload includes units, we use `em.assign`. This is the best way to handle
    // nested embeddable data, as it correctly converts the plain objects from the
    // validated payload into the required Embeddable class instances (Unit, Activity, etc.).
    if (units && units.length > 0) {
      this.em.assign(course, { units })
    }

    await this.em.flush()

    this.logger.info({ courseId: course.id }, 'Course created successfully.')

    return course
  }

  public async findAll(): Promise<Course[]> {
    this.logger.info('Fetching all courses.')

    return this.em.find(
      Course,
      {},
      {
        populate: ['courseType', 'professor'],
      }
    )
  }

  public async findOne(id: string): Promise<Course> {
    this.logger.info({ courseId: id }, 'Fetching course.')

    return this.em.findOneOrFail(
      Course,
      { id },
      {
        populate: ['courseType', 'professor'],
      }
    );
  }

  public async update(
    id: string,
    courseData: UpdateCourseType
  ): Promise<Course> {
    this.logger.info({ courseId: id, data: courseData }, 'Updating course.')

    const course = await this.em.findOneOrFail(Course, { id });
    this.em.assign(course, courseData);
    await this.em.flush();

    this.logger.info({ courseId: id }, 'Course updated successfully.')

    return course;
  }

  public async remove(id: string): Promise<void> {
    this.logger.info({ courseId: id }, 'Deleting course.')

    const courseRef = this.em.getReference(Course, id);
    await this.em.removeAndFlush(courseRef);

    this.logger.info({ courseId: id }, 'Course deleted successfully.')
  }
}
