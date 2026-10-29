export interface User {
  name: string;
  email: string;
}

export abstract class AbstractUserRepository {
  abstract findById(id: string): Promise<User | null>;
}
