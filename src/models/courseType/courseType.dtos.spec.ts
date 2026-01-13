import * as v from 'valibot';
import { CourseTypeFilterSchema } from './courseType.dtos';

describe('CourseType DTOs - Unit Tests', () => {
  describe('CourseTypeFilterSchema', () => {
    it('should validate a valid course type filter', () => {
      const validData = {
        id: '123',
        name: 'Programming',
        description: 'Programming courses',
      };

      const result = v.safeParse(CourseTypeFilterSchema, validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output).toEqual(validData);
      }
    });
  });
});
