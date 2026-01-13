import { CourseType } from './courseType.entity';
import { mapCourseTypeToFilter } from './courseType.mappers';

describe('CourseType Mappers - Unit Tests', () => {
  describe('mapCourseTypeToFilter', () => {
    it('should map course type to filter response', () => {
      const courseType = new CourseType();
      courseType.id = '123';
      courseType.name = 'Programming';
      courseType.description = 'Programming courses';

      const result = mapCourseTypeToFilter(courseType);

      expect(result).toEqual({
        id: '123',
        name: 'Programming',
        description: 'Programming courses',
      });
    });
  });
});
