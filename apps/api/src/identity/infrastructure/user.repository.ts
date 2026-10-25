import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
  type User,
  UserRepository as UserRepositoryPort,
} from '../domain/user.repository.js';

@Injectable()
export class UserRepository extends UserRepositoryPort {
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
