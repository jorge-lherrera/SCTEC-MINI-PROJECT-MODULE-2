import 'dotenv/config';
import { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: requireEnvironmentVariable('DB_HOST'),
  port: Number(requireEnvironmentVariable('DB_PORT')),
  username: requireEnvironmentVariable('DB_USERNAME'),
  password: requireEnvironmentVariable('DB_PASSWORD'),
  database: requireEnvironmentVariable('DB_NAME'),
  entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: ['error'],
};

export default new DataSource(dataSourceOptions);
