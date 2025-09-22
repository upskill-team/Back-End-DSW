/**
 * @module Models/Course/Service
 * @remarks Encapsulates the business logic for managing courses.
 */

import { EntityManager, FilterQuery } from "@mikro-orm/core";
import { Course } from "./course.entity.js";
import {
  CreateCourseType,
  SearchCoursesQuery,
  UpdateCourseType,
} from "./course.schemas.js";
import { Professor } from "../professor/professor.entity.js";
import { CourseType } from "../courseType/courseType.entity.js";
import { Logger } from "pino";
import { ObjectId } from "@mikro-orm/mongodb";
import { User } from "../user/user.entity.js";
import { safeParse } from "valibot";
import { UpdateCourseSchema } from "./course.schemas.js";

/**
 * Provides methods for CRUD operations on Course entities.
 * @class CourseService
 */
export class CourseService {
  private em: EntityManager;
  private logger: Logger;

  constructor(em: EntityManager, logger: Logger) {
    this.em = em;
    this.logger = logger.child({ context: { service: "CourseService" } });
  }

  /**
   * Creates a new course.
   * @param {CreateCourseType} courseData - The validated data for the new course.
   * @param {string} professorId - The ID of the professor creating the course.
   * @returns {Promise<Course>} A promise that resolves to the newly created course.
   */
  public async create(
    courseData: CreateCourseType,
    professorId: string,
    imageUrl?: string
  ): Promise<Course> {
    this.logger.info({ name: courseData.name }, "Creating new course.");

    const { courseTypeId, ...topLevelData } = courseData;

    await this.em.findOneOrFail(Professor, { _id: new ObjectId(professorId) });
    await this.em.findOneOrFail(CourseType, {
      _id: new ObjectId(courseTypeId),
    });

    const professorRef = this.em.getReference(
      Professor,
      new ObjectId(professorId)
    );
    const courseTypeRef = this.em.getReference(
      CourseType,
      new ObjectId(courseTypeId)
    );

    const course = new Course();

    this.em.assign(course, {
      ...topLevelData,
      isFree: topLevelData.price === 0 || topLevelData.price === undefined,
      units: [],
      imageUrl: imageUrl,
      courseType: courseTypeRef,
      professor: professorRef,
    });

    await this.em.persistAndFlush(course);

    this.logger.info(
      { courseId: course.id },
      "Course entity created successfully. Now syncing relations."
    );

    const emFork = this.em.fork();

    const professor = await emFork.findOneOrFail(
      Professor,
      { _id: new ObjectId(professorId) },
      { populate: ["courses"] }
    );
    const courseType = await emFork.findOneOrFail(
      CourseType,
      { _id: new ObjectId(courseTypeId) },
      { populate: ["courses"] }
    );

    const courseRef = emFork.getReference(Course, new ObjectId(course.id!));

    professor.courses.add(courseRef);
    courseType.courses.add(courseRef);

    await emFork.flush();

    this.logger.info(
      { courseId: course.id },
      "Professor and CourseType relations synced."
    );

    return course;
  }

  /**
   * Retrieves all courses from the database.
   * @returns {Promise<Course[]>} A promise that resolves to an array of all courses.
   */
  public async findAll(): Promise<Course[]> {
    this.logger.info("Fetching all courses.");

    return this.em.find(
      Course,
      {},
      {
        populate: ["courseType", "professor"],
      }
    );
  }

  public async findOne(id: string): Promise<Course> {
    this.logger.info({ courseId: id }, "Fetching course.");

    const objectId = new ObjectId(id);
    return this.em.findOneOrFail(
      Course,
      { _id: objectId },
      {
        populate: ["courseType", "professor"],
      }
    );
  }

  /**
   * Updates an existing course.
   * @param {string} id - The ID of the course to update.
   * @param {UpdateCourseType} data - An object containing the fields to update.
   * @param {string} userId - The ID of the authenticated user.
   * @returns {Promise<Course>} A promise that resolves to the updated course entity.
   * @throws {Error} If validation fails, the course is not found, or user doesn't own the course.
   */
  public async update(
    id: string,
    data: any,
    userId: string,
    imageUrl?: string,
    materialFiles: Express.Multer.File[] = []
  ): Promise<Course> {
    this.logger.info({ courseId: id, data: data, userId }, "Updating course.");

    const objectId = new ObjectId(id);
    const userObjectId = new ObjectId(userId);

    const user = await this.em.findOne(
      User,
      { _id: userObjectId },
      { populate: ["professorProfile"] }
    );

    if (!user?.professorProfile) {
      throw new Error("User is not a professor");
    }

    const course = await this.em.findOneOrFail(Course, {
      _id: objectId,
      professor: new ObjectId(user.professorProfile.id),
    });

    console.log("--- Archivos recibidos por Multer ---");
    console.log(materialFiles);

    const fileUrlMap = new Map<string, string>();
    for (const file of materialFiles) {
      fileUrlMap.set(file.originalname, file.path);
    }

    console.log("--- Mapa de URLs generado ---");
    console.log(fileUrlMap);

    if (data.units && data.units.length > 0) {
      for (const unit of data.units) {
        if (unit.materials && unit.materials.length > 0) {
          for (const material of unit.materials) {
            const placeholder = material.url;
            if (fileUrlMap.has(placeholder)) {
              material.url = fileUrlMap.get(placeholder)!;
            }
          }
        }
      }
    }

    const validationResult = safeParse(UpdateCourseSchema, data);
    if (!validationResult.success) {
      this.logger.error(
        { issues: validationResult.issues },
        "Validation failed AFTER URL replacement."
      );
      throw new Error(
        "Validation failed: " + JSON.stringify(validationResult.issues)
      );
    }

    const validatedData: UpdateCourseType = validationResult.output;

    const updateData: Partial<Course> = { ...(validatedData as any) };
    if (validatedData.price !== undefined) {
      (updateData as any).isFree = validatedData.price === 0;
    }

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    this.em.assign(course, updateData);

    await this.em.flush();

    this.logger.info({ courseId: id }, "Course updated successfully.");

    return course;
  }

  /**
   * Deletes a course from the database.
   * @param {string} id - The ID of the course to remove.
   * @param {string} userId - The ID of the authenticated user.
   * @returns {Promise<void>} A promise that resolves when the course is deleted.
   * @throws {Error} If the course is not found or user doesn't own the course.
   */
  public async remove(id: string, userId: string): Promise<void> {
    this.logger.info({ courseId: id, userId }, "Deleting course.");

    const objectId = new ObjectId(id);
    const userObjectId = new ObjectId(userId);

    const user = await this.em.findOne(
      User,
      { _id: userObjectId },
      { populate: ["professorProfile"] }
    );

    if (!user?.professorProfile) {
      throw new Error("User is not a professor");
    }

    const course = await this.em.findOneOrFail(Course, {
      _id: objectId,
      professor: new ObjectId(user.professorProfile.id),
    });

    await this.em.removeAndFlush(course);

    this.logger.info({ courseId: id }, "Course deleted successfully.");
  }

  /**
   * Retrieves all courses for a professor user.
   * @param {string} userId - The ID of the authenticated user.
   * @returns {Promise<Course[]>} A promise that resolves to an array of courses owned by the professor.
   * @throws {Error} If the user is not found or is not a professor.
   */
  public async findCoursesOfProfessor(userId: string): Promise<Course[]> {
    this.logger.info(
      { userId },
      "Fetching courses for an authenticated professor."
    );

    const userObjectId = new ObjectId(userId);

    const user = await this.em.findOne(
      User,
      { _id: userObjectId },
      { populate: ["professorProfile"] }
    );

    if (!user || !user.professorProfile) {
      throw new Error("User is not a professor");
    }

    const professorObjectId = new ObjectId(user.professorProfile.id);

    return await this.em.find(
      Course,
      { professor: professorObjectId },
      { populate: ["courseType", "professor"] }
    );
  }

  /**
   * Searches for courses based on various filters.
   * @param {SearchCoursesQuery} query - The search filters and pagination options.
   * @returns {Promise<{courses: Course[], total: number}>} A promise that resolves to an object containing the array of matching courses and the total count.
   */
  async searchCourses(
    query: SearchCoursesQuery
  ): Promise<{ courses: Course[]; total: number }> {
    const where: FilterQuery<Course> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.isFree !== undefined) {
      where.isFree = query.isFree;
    }

    if (query.q) {
      // Búsqueda de texto libre (case-insensitive) en nombre y descripción
      const searchQuery = { $ilike: `%${query.q}%` };
      where.$or = [{ name: searchQuery }, { description: searchQuery }];
    }

    // Usamos findAndCount para obtener resultados paginados y el total en una sola query
    const [courses, total] = await this.em.findAndCount(Course, where, {
      populate: ["professor", "courseType"], // Precarga relaciones para evitar N+1 queries
      orderBy: { [query.sortBy]: query.sortOrder },
      limit: query.limit,
      offset: query.offset,
    });

    return { courses, total };
  }
}
