import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAppointmentsTable1793647600000 implements MigrationInterface {
    name = 'CreateAppointmentsTable1793647600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
        await queryRunner.query(`CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'in_progress', 'done', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "doctor_id" integer NOT NULL, "patient_id" integer NOT NULL, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."appointment_status" NOT NULL DEFAULT 'scheduled', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_appointments_period" CHECK ("starts_at" < "ends_at"), CONSTRAINT "EXC_appointments_patient_period" EXCLUDE USING gist ("patient_id" WITH =, tstzrange("starts_at", "ends_at") WITH &&) WHERE ("status" <> 'cancelled'), CONSTRAINT "EXC_appointments_doctor_period" EXCLUDE USING gist ("doctor_id" WITH =, tstzrange("starts_at", "ends_at") WITH &&) WHERE ("status" <> 'cancelled'), CONSTRAINT "PK_appointments" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_appointments_patient_starts_at" ON "appointments" ("patient_id", "starts_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_appointments_doctor_starts_at" ON "appointments" ("doctor_id", "starts_at")`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_patient"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_doctor"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_appointments_doctor_starts_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_appointments_patient_starts_at"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_status"`);
    }

}
