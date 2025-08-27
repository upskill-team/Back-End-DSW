import {
  Entity,
  OneToMany,
  Property,
  Collection,
  Rel,
  Enum,
  OneToOne,
} from '@mikro-orm/core';
import { BaseEntity } from '../../shared/db/baseEntity.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { Student } from '../student/student.entity.js';
import { Appeal } from '../appeal/appeal.entity.js';

export enum UserRole {
  ADMIN = 'admin',
  PROFESSOR = 'professor',
  STUDENT = 'student',
}

@Entity()
export class User extends BaseEntity {

  @Property({ nullable: false })
  name!: string;

  @Property({ nullable: false })
  surname!: string;

  @Property({ nullable: false, unique: true })
  mail!: string;

  @Property({ nullable: true })
  profile_picture?: string;

  @Property({ nullable: false, hidden: true }) //hidden true to not expose password in responses
  password!: string;

  @Property({ nullable: true, hidden: true })
  resetPasswordToken?: string;

  @Property({ nullable: true, hidden: true })
  resetPasswordExpires?: Date;

  @Enum( () => UserRole)
  role: UserRole = UserRole.STUDENT;

  @OneToOne(() => Student, (student) => student.user, {
    owner: true,
    nullable: true, //nullable: false <- check if this is needed
    orphanRemoval: true,
  })
  studentProfile?: Rel<Student>;

  @OneToOne(() => Professor, (professor) => professor.user, {
    owner: true,
    nullable: true,
    orphanRemoval: true,
  })
  professorProfile?: Rel<Professor>

  @OneToMany(() => Appeal, (appeal) => appeal.user)
  appeals = new Collection<Appeal>(this);
}
