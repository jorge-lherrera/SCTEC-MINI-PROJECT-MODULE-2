import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { USER_EMAIL_UNIQUE_CONSTRAINT, User } from '../entities/user.entity';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { isUniqueViolation } from '../utils/database-error.util';

export type CreatableUser = Pick<User, 'name' | 'email' | 'password' | 'roles'>;

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  public async create(
    data: CreatableUser,
    manager?: EntityManager,
  ): Promise<User> {
    const repository = manager?.getRepository(User) ?? this.repository;

    try {
      return await repository.save(repository.create(data));
    } catch (error) {
      if (isUniqueViolation(error, USER_EMAIL_UNIQUE_CONSTRAINT)) {
        throw new DomainError(
          ErrorCode.EMAIL_JA_CADASTRADO,
          'E-mail já cadastrado.',
        );
      }

      throw error;
    }
  }

  public async findById(id: number): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  public async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  public async existsByEmail(email: string): Promise<boolean> {
    return this.repository.existsBy({ email });
  }
}
