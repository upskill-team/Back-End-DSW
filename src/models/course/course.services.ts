/**
 * @module Models/Course/Service
 * @remarks Encapsulates the business logic for managing courses.
 */

import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { Course, status } from './course.entity.js';
import {
  CreateCourseType,
  SearchCoursesQuery,
  UpdateCourseType,
} from './course.schemas.js';
import { Professor } from '../professor/professor.entity.js';
import { CourseType } from '../courseType/courseType.entity.js';
import { Logger } from 'pino';
import { ObjectId } from '@mikro-orm/mongodb';
import { User } from '../user/user.entity.js';
import { safeParse } from 'valibot';
import { UpdateCourseSchema } from './course.schemas.js';

/**
 * Provides methods for CRUD operations on Course entities.
 * @class CourseService
 */
export class CourseService {
  private em: EntityManager;
  private logger: Logger;

  constructor(em: EntityManager, logger: Logger) {
    this.em = em;
    this.logger = logger.child({ context: { service: 'CourseService' } });
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
    this.logger.info({ name: courseData.name }, 'Creating new course.');

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
      'Course entity created successfully. Now syncing relations.'
    );

    const emFork = this.em.fork();

    const professor = await emFork.findOneOrFail(
      Professor,
      { _id: new ObjectId(professorId) },
      { populate: ['courses'] }
    );
    const courseType = await emFork.findOneOrFail(
      CourseType,
      { _id: new ObjectId(courseTypeId) },
      { populate: ['courses'] }
    );

    const courseRef = emFork.getReference(Course, new ObjectId(course.id!));

    professor.courses.add(courseRef);
    courseType.courses.add(courseRef);

    await emFork.flush();

    this.logger.info(
      { courseId: course.id },
      'Professor and CourseType relations synced.'
    );

    return course;
  }

  /**
   * Retrieves all courses from the database.
   * @returns {Promise<Course[]>} A promise that resolves to an array of all courses.
   */
  public async findAll(): Promise<Course[]> {
    this.logger.info('Fetching all courses.');

    return this.em.find(
      Course,
      {},
      {
        populate: ['courseType', 'professor'],
      }
    );
  }

  public async findOne(id: string): Promise<Course> {
    this.logger.info({ courseId: id }, 'Fetching course.');

    const objectId = new ObjectId(id);
    return this.em.findOneOrFail(
      Course,
      { _id: objectId },
      {
        populate: ["courseType", "professor.user"],
      }
    );
  }

  /**
   * Finds the top 4 most popular courses based on the number of enrolled students.
   * @returns {Promise<Course[]>} A promise that resolves to an array of the top 4 courses.
   */
  public async findTrendingCourses(): Promise<Course[]> {
      this.logger.info('Fetching trending courses.');
  
      const courses = await this.em.find(
        Course,
        { status: status.PUBLISHED },
        {
          populate: ['courseType', 'professor.user', 'students'],
          orderBy: { students: 'DESC' },
          limit: 6,
        }
      );
  
      return courses;
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
    this.logger.info({ courseId: id, data: data, userId }, 'Updating course.');

    const objectId = new ObjectId(id);
    const userObjectId = new ObjectId(userId);

    const user = await this.em.findOne(
      User,
      { _id: userObjectId },
      { populate: ['professorProfile'] }
    );

    if (!user?.professorProfile) {
      throw new Error('User is not a professor');
    }

    const course = await this.em.findOneOrFail(Course, {
      _id: objectId,
      professor: new ObjectId(user.professorProfile.id),
    });

    console.log('--- Archivos recibidos por Multer ---');
    console.log(materialFiles);

    const fileUrlMap = new Map<string, string>();
    for (const file of materialFiles) {
      fileUrlMap.set(file.originalname, file.path);
    }

    console.log('--- Mapa de URLs generado ---');
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
        'Validation failed AFTER URL replacement.'
      );
      throw new Error(
        'Validation failed: ' + JSON.stringify(validationResult.issues)
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

    this.logger.info({ courseId: id }, 'Course updated successfully.');

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
    this.logger.info({ courseId: id, userId }, 'Deleting course.');

    const objectId = new ObjectId(id);
    const userObjectId = new ObjectId(userId);

    const user = await this.em.findOne(
      User,
      { _id: userObjectId },
      { populate: ['professorProfile'] }
    );

    if (!user?.professorProfile) {
      throw new Error('User is not a professor');
    }

    const course = await this.em.findOneOrFail(Course, {
      _id: objectId,
      professor: new ObjectId(user.professorProfile.id),
    });

    await this.em.removeAndFlush(course);

    this.logger.info({ courseId: id }, 'Course deleted successfully.');
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
      'Fetching courses for an authenticated professor.'
    );

    const userObjectId = new ObjectId(userId);

    const user = await this.em.findOne(
      User,
      { _id: userObjectId },
      { populate: ['professorProfile'] }
    );

    if (!user || !user.professorProfile) {
      throw new Error('User is not a professor');
    }

    const professorObjectId = new ObjectId(user.professorProfile.id);

    return await this.em.find(
      Course,
      { professor: professorObjectId },
      { populate: ['courseType', 'professor'] }
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
    this.logger.info({ query }, 'Searching courses with filters.');

    const where: FilterQuery<Course> = {};

    if (query.q) {
      where.name = new RegExp(query.q, 'i')
    }
    
    if (query.courseTypeId) {
      where.courseType = new ObjectId(query.courseTypeId);
    }
    
    if (query.isFree !== undefined) {
      where.isFree = query.isFree;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [courses, total] = await this.em.findAndCount(Course, where, {
      populate: ['courseType', 'professor.user'],
      orderBy: { [query.sortBy]: query.sortOrder as 'asc' | 'desc' },
      limit: query.limit,
      offset: query.offset,
    });

    return { courses, total };
  }

  /**
   * Creates a new unit in an existing course.
   * Automatically assigns the next available unitNumber.
   * @param {string} courseId - The ID of the course.
   * @param {CreateUnitType} unitData - The validated data for the new unit.
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Course>} The updated course with the new unit.
   */
  public async createUnit(
    courseId: string,
    unitData: any, // CreateUnitType - temporarily using any to avoid import issues
    professorId: string
  ): Promise<Course> {
    this.logger.info({ courseId, unitData }, 'Creating new unit');

    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    // Calculate the next available unitNumber automatically
    // Find the highest unitNumber and add 1, or start with 1 if no units exist
    const maxUnitNumber =
      course.units.length > 0
        ? Math.max(...course.units.map((u) => u.unitNumber))
        : 0;
    const nextUnitNumber = maxUnitNumber + 1;

    // Create new unit with auto-assigned unitNumber
    const newUnit = {
      unitNumber: nextUnitNumber,
      name: unitData.name,
      detail: unitData.detail,
      materials: unitData.materials || [],
      questions: [],
    };

    course.units.push(newUnit);
    await this.em.persistAndFlush(course);

    this.logger.info(
      { courseId, unitNumber: nextUnitNumber },
      'Unit created successfully with auto-assigned unitNumber'
    );
    return course;
  }

  /**
   * Updates an existing unit in a course.
   * @param {string} courseId - The ID of the course.
   * @param {number} unitNumber - The number of the unit to update.
   * @param {UpdateUnitType} updateData - The validated data for updating the unit.
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Course>} The updated course.
   */
  public async updateUnit(
    courseId: string,
    unitNumber: number,
    updateData: any, // UpdateUnitType
    professorId: string
  ): Promise<Course> {
    this.logger.info({ courseId, unitNumber, updateData }, 'Updating unit');

    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const unitIndex = course.units.findIndex(
      (u) => u.unitNumber === unitNumber
    );
    if (unitIndex === -1) {
      throw new Error(`Unit ${unitNumber} not found in course ${courseId}`);
    }

    // Update unit fields
    const unit = course.units[unitIndex];
    if (updateData.name !== undefined) unit.name = updateData.name;
    if (updateData.detail !== undefined) unit.detail = updateData.detail;
    if (updateData.materials !== undefined)
      unit.materials = updateData.materials;
    if (
      updateData.unitNumber !== undefined &&
      updateData.unitNumber !== unitNumber
    ) {
      // Check if new unit number already exists
      const existingUnit = course.units.find(
        (u) => u.unitNumber === updateData.unitNumber
      );
      if (existingUnit) {
        throw new Error(`Unit number ${updateData.unitNumber} already exists`);
      }
      unit.unitNumber = updateData.unitNumber;
    }

    await this.em.persistAndFlush(course);

    this.logger.info({ courseId, unitNumber }, 'Unit updated successfully');
    return course;
  }

  /**
   * Deletes a unit from a course.
   * @param {string} courseId - The ID of the course.
   * @param {number} unitNumber - The number of the unit to delete.
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Course>} The updated course without the deleted unit.
   */
  public async deleteUnit(
    courseId: string,
    unitNumber: number,
    professorId: string
  ): Promise<Course> {
    this.logger.info({ courseId, unitNumber }, 'Deleting unit');

    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const unitIndex = course.units.findIndex(
      (u) => u.unitNumber === unitNumber
    );
    if (unitIndex === -1) {
      throw new Error(`Unit ${unitNumber} not found in course ${courseId}`);
    }

    // Remove the unit
    course.units.splice(unitIndex, 1);
    await this.em.persistAndFlush(course);

    this.logger.info({ courseId, unitNumber }, 'Unit deleted successfully');
    return course;
  }

  /**
   * Reorders units within a course.
   * Frontend sends: { units: [{ unitNumber: 3, newOrder: 1 }, { unitNumber: 1, newOrder: 2 }, ...] }
   * @param {string} courseId - The ID of the course.
   * @param {ReorderUnitsType} reorderData - The reordering instructions.
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Course>} The course with reordered units.
   */
  public async reorderUnits(
    courseId: string,
    reorderData: any, // ReorderUnitsType
    professorId: string
  ): Promise<Course> {
    this.logger.info({ courseId, reorderData }, 'Reordering units');

    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    // Validate that all unitNumbers exist in the course
    for (const reorderItem of reorderData.units) {
      const unit = course.units.find(
        (u) => u.unitNumber === reorderItem.unitNumber
      );
      if (!unit) {
        throw new Error(
          `Unit ${reorderItem.unitNumber} not found in course ${courseId}`
        );
      }
    }

    // Apply reordering - update each unit with its new unitNumber based on newOrder
    for (const reorderItem of reorderData.units) {
      const unit = course.units.find(
        (u) => u.unitNumber === reorderItem.unitNumber
      );
      if (unit) {
        unit.unitNumber = reorderItem.newOrder;
      }
    }

    // Sort units by new unit numbers to maintain order
    course.units.sort((a, b) => a.unitNumber - b.unitNumber);

    await this.em.persistAndFlush(course);

    this.logger.info({ courseId }, 'Units reordered successfully');
    return course;
  }

  /**
   * Adds a material to a specific unit.
   * @param {string} courseId - The ID of the course.
   * @param {number} unitNumber - The number of the unit.
   * @param {CreateMaterialType} materialData - The material data.
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Course>} The updated course.
   */
  public async addMaterial(
    courseId: string,
    unitNumber: number,
    materialData: any, // CreateMaterialType
    professorId: string
  ): Promise<Course> {
    this.logger.info(
      { courseId, unitNumber, materialData },
      'Adding material to unit'
    );

    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const unit = course.units.find((u) => u.unitNumber === unitNumber);
    if (!unit) {
      throw new Error(`Unit ${unitNumber} not found in course ${courseId}`);
    }

    unit.materials.push(materialData);
    await this.em.persistAndFlush(course);

    this.logger.info({ courseId, unitNumber }, 'Material added successfully');
    return course;
  }

  /**
   * Removes a material from a specific unit.
   * @param {string} courseId - The ID of the course.
   * @param {number} unitNumber - The number of the unit.
   * @param {number} materialIndex - The index of the material to remove.
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Course>} The updated course.
   */
  public async removeMaterial(
    courseId: string,
    unitNumber: number,
    materialIndex: number,
    professorId: string
  ): Promise<Course> {
    this.logger.info(
      { courseId, unitNumber, materialIndex },
      'Removing material from unit'
    );

    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    const unit = course.units.find((u) => u.unitNumber === unitNumber);
    if (!unit) {
      throw new Error(`Unit ${unitNumber} not found in course ${courseId}`);
    }

    if (materialIndex < 0 || materialIndex >= unit.materials.length) {
      throw new Error(`Material index ${materialIndex} is out of bounds`);
    }

    unit.materials.splice(materialIndex, 1);
    await this.em.persistAndFlush(course);

    this.logger.info(
      { courseId, unitNumber, materialIndex },
      'Material removed successfully'
    );
    return course;
  }

  /**
   * Performs a quick save operation without full validation.
   * @param {string} courseId - The ID of the course.
   * @param {QuickSaveType} quickSaveData - The quick save data.
   * @param {string} professorId - The ID of the professor (for access control).
   * @returns {Promise<Course>} The updated course.
   */
  public async quickSave(
    courseId: string,
    quickSaveData: any, // QuickSaveType
    professorId: string
  ): Promise<Course> {
    this.logger.info(
      { courseId, type: quickSaveData.type },
      'Performing quick save'
    );

    const course = await this.em.findOneOrFail(Course, {
      _id: new ObjectId(courseId),
      professor: new ObjectId(professorId),
    });

    // Apply changes based on type
    switch (quickSaveData.type) {
      case 'course-config': {
        if (quickSaveData.data.name) course.name = quickSaveData.data.name;
        if (quickSaveData.data.description)
          course.description = quickSaveData.data.description;
        if (quickSaveData.data.price !== undefined) {
          course.price = quickSaveData.data.price;
          course.isFree = quickSaveData.data.price === 0;
        }
        break;
      }
      case 'unit-content': {
        const unitNumber = quickSaveData.data.unitNumber;
        const unit = course.units.find((u) => u.unitNumber === unitNumber);
        if (unit) {
          if (quickSaveData.data.name) unit.name = quickSaveData.data.name;
          if (quickSaveData.data.detail)
            unit.detail = quickSaveData.data.detail;
        }
        break;
      }
      // Add more cases as needed
    }

    await this.em.persistAndFlush(course);

    this.logger.info(
      { courseId, type: quickSaveData.type },
      'Quick save completed'
    );
    return course;
  }
}
