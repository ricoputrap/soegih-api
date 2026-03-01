export const USER_REPOSITORY_TOKEN = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findByUsername(username: string): Promise<{
    id: string;
    username: string;
    password: string;
    created_at: Date;
    updated_at: Date;
  } | null>;

  create(data: {
    username: string;
    password: string;
  }): Promise<{
    id: string;
    username: string;
    created_at: Date;
    updated_at: Date;
  }>;
}
