/**
 * @module Models/Professor/Mappers
 * @remarks Functions to map Professor entities to filtered DTOs.
 */

import { Professor } from './professor.entity.js';
import { wrap } from '@mikro-orm/core';
import { ProfessorFilterResponse } from './professor.dtos.js';

/**
 * Maps a professor to filter view (for dropdowns/searches)
 * Only includes id, name, surname, profilePicture - NO sensitive data
 */
export function mapProfessorToFilter(
  professor: Professor
): ProfessorFilterResponse {
  const wrappedProfessor = wrap(professor).toObject();
  const user = wrappedProfessor.user as any;

  return {
    id: professor.id!,
    name: user?.name || '',
    surname: user?.surname || '',
    profilePicture: user?.profile_picture,
  };
}
