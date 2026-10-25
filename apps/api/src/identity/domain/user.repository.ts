export interface User {
  name: string;
  email: string;
}

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
}
