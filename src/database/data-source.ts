import 'dotenv/config';
import { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';
import {
  readBooleanEnvironmentVariable,
  requireEnvironmentVariable,
  requireIntegerEnvironmentVariable,
} from '../utils/environment.util';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: requireEnvironmentVariable('DB_HOST'),
  port: requireIntegerEnvironmentVariable('DB_PORT'),
  username: requireEnvironmentVariable('DB_USERNAME'),
  password: requireEnvironmentVariable('DB_PASSWORD'),
  database: requireEnvironmentVariable('DB_NAME'),
  ssl: readBooleanEnvironmentVariable('DB_SSL'),
  entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsRun: true,
  synchronize: false,
  logging: ['error'],
};

export default new DataSource(dataSourceOptions);
