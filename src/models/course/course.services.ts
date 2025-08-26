import { EntityManager } from '@mikro-orm/core';
import { Course } from './course.entity.js';
import {
  CreateCourseType,
  UpdateCourseType,
} from './course.schemas.js';
import { Professor } from '../professor/professor.entity.js';
import { CourseType } from '../courseType/courseType.entity.js';

export class CourseService {
  private em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  public async create(
    courseData: CreateCourseType,
    professorId: string
  ): Promise<Course> {
    const { courseTypeId, ...restOfCourseData } = courseData;

    const course = this.em.create(Course, {
      ...restOfCourseData,
      courseType: this.em.getReference(CourseType, courseTypeId),
      professor: this.em.getReference(Professor, professorId),
    });

    await this.em.flush();
    return course;
  }

  public async findAll(): Promise<Course[]> {
    return this.em.find(
      Course,
      {},
      {
        populate: ['courseType', 'professor', 'students'],
      }
    );
  }

  public async findOne(id: string): Promise<Course> {
    return this.em.findOneOrFail(
      Course,
      { id },
      {
        populate: ['courseType', 'professor', 'students'],
      }
    );
  }

  public async update(
    id: string,
    courseData: UpdateCourseType
  ): Promise<Course> {
    const course = await this.em.findOneOrFail(Course, { id });
    this.em.assign(course, courseData);
    await this.em.flush();
    return course;
  }

  public async remove(id: string): Promise<void> {
    const courseRef = this.em.getReference(Course, id);
    await this.em.removeAndFlush(courseRef);
  }
}
