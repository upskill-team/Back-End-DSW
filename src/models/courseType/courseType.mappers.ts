/**
 * @module Models/CourseType/Mappers
 * @remarks Functions to map CourseType entities to filtered DTOs.
 */

import { CourseType } from './courseType.entity.js';
import { CourseTypeFilterResponse } from './courseType.dtos.js';

/**
 * Maps a course type to filter view (for dropdowns/searches)
 * Only includes id and name
 */
export function mapCourseTypeToFilter(
  courseType: CourseType
): CourseTypeFilterResponse {
  return {
    id: courseType.id!,
    name: courseType.name,
  };
}
