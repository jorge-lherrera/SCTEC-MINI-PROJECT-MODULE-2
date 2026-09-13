import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export type CreatableUser = Pick<User, 'name' | 'email' | 'password' | 'role'>;

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  public async create(data: CreatableUser): Promise<User> {
    const user = this.repository.create(data);

    return this.repository.save(user);
  }

  public async findById(id: string): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
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
