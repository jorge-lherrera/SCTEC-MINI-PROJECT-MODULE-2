import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePatientsTable1793388400000 implements MigrationInterface {
    name = 'CreatePatientsTable1793388400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "patients" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying(120) NOT NULL, "cpf" character(11) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_patients_cpf_format" CHECK ("cpf" ~ '^[0-9]{11}$'), CONSTRAINT "PK_patients" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_patients_cpf" ON "patients" ("cpf") WHERE "deleted_at" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_patients_cpf"`);
        await queryRunner.query(`DROP TABLE "patients"`);
    }

}
