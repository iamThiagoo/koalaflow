import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
  AbstractUserRepository,
  type User,
} from '../domain/AbstractUser.Repository.js';

@Injectable()
export class UserRepository extends AbstractUserRepository {
  constructor(private readonly em: EntityManager) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.em
      .getConnection()
      .execute<User[]>(`select name, email from "user" where id = ?`, [id]);

    return user ?? null;
  }
}
