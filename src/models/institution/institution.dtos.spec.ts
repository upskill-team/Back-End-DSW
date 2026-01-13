import * as v from 'valibot';
import { InstitutionFilterSchema } from './institution.dtos';

describe('Institution DTOs - Unit Tests', () => {
  describe('InstitutionFilterSchema', () => {
    it('should validate a valid institution filter', () => {
      const validData = {
        id: '456',
        name: 'Test University',
        description: 'A test university',
      };

      const result = v.safeParse(InstitutionFilterSchema, validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output).toEqual(validData);
      }
    });
  });
});
