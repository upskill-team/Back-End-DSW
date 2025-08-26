// src/models/course/course.services.ts

import { EntityManager } from '@mikro-orm/core';
import { Course } from './course.entity.js';
import { CreateCourseType, UpdateCourseType } from './course.schemas.js';
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
    const { courseTypeId, units, ...topLevelData } = courseData;

    // Create the course entity. It's important to provide default values for properties
    // like 'isFree' and 'units' here to satisfy TypeScript's strict type check,
    // as it doesn't infer the defaults from the class definition in this context.
    const course = this.em.create(Course, {
      ...topLevelData,
      isFree: topLevelData.isFree ?? true,
      units: [], // Start with an empty array. We'll assign the real units below if they exist.
      courseType: this.em.getReference(CourseType, courseTypeId),
      professor: this.em.getReference(Professor, professorId),
    });

    // If the payload includes units, we use `em.assign`. This is the best way to handle
    // nested embeddable data, as it correctly converts the plain objects from the
    // validated payload into the required Embeddable class instances (Unit, Activity, etc.).
    if (units && units.length > 0) {
      this.em.assign(course, { units });
    }

    await this.em.flush();
    return course;
  }

  public async findAll(): Promise<Course[]> {
    return this.em.find(
      Course,
      {},
      {
        populate: ['courseType', 'professor'],
      }
    );
  }

  public async findOne(id: string): Promise<Course> {
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
