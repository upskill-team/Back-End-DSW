/**
 * @module Models/Institution/Mappers
 * @remarks Functions to map Institution entities to filtered DTOs.
 */

import { Institution } from './institution.entity.js';
import { InstitutionFilterResponse } from './institution.dtos.js';

/**
 * Maps an institution to filter view (for dropdowns/searches)
 * Only includes id and name
 */
export function mapInstitutionToFilter(
  institution: Institution
): InstitutionFilterResponse {
  return {
    id: institution.id!,
    name: institution.name,
    description: institution.description,
  };
}
