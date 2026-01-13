import { Institution } from './institution.entity';
import { mapInstitutionToFilter } from './institution.mappers';

describe('Institution Mappers - Unit Tests', () => {
  describe('mapInstitutionToFilter', () => {
    it('should map institution to filter response', () => {
      const institution = new Institution();
      institution.id = '456';
      institution.name = 'Test University';
      institution.description = 'A test university';

      const result = mapInstitutionToFilter(institution);

      expect(result).toEqual({
        id: '456',
        name: 'Test University',
        description: 'A test university',
      });
    });
  });
});
