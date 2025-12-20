/**
 * @module Models/Assessment/Mappers
 * @remarks Mapper functions to convert Assessment entities to DTOs.
 */

import { AssessmentPublicSchema } from './assessment.dtos';

export const AssessmentMapper = {
  toResponseDto(assessment: any): AssessmentPublicSchema {

    return {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      durationMinutes: assessment.durationMinutes,
      passingScore: assessment.passingScore,
      maxAttempts: assessment.maxAttempts,
      isActive: assessment.isActive,
      
      availableFrom: assessment.availableFrom 
        ? new Date(assessment.availableFrom).toISOString() 
        : undefined,
      availableUntil: assessment.availableUntil 
        ? new Date(assessment.availableUntil).toISOString() 
        : undefined,

      attemptsCount: assessment.attemptsCount || 0,
      attemptsRemaining: assessment.attemptsRemaining,
      bestScore: assessment.bestScore,
      lastAttemptDate: assessment.lastAttemptDate 
        ? new Date(assessment.lastAttemptDate).toISOString() 
        : undefined,
      status: assessment.status || 'available',
    };
  },

  toResponseDtoList(assessments: any[]): AssessmentPublicSchema[] {
    return assessments.map((assessment) => this.toResponseDto(assessment));
  }
};