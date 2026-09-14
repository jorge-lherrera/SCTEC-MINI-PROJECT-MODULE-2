CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE "public"."users_role_enum" AS ENUM ('ADMINISTRADOR', 'ATENDENTE');

CREATE TABLE "users" (
    "id"         uuid                     NOT NULL DEFAULT uuid_generate_v4(),
    "name"       character varying(120)   NOT NULL,
    "email"      character varying(160)   NOT NULL,
    "password"   character varying(255)   NOT NULL,
    "role"       "public"."users_role_enum" NOT NULL DEFAULT 'ATENDENTE',
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
);
