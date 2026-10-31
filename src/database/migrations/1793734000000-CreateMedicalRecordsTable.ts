import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMedicalRecordsTable1793734000000 implements MigrationInterface {
    name = 'CreateMedicalRecordsTable1793734000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "medical_records" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "patient_id" integer NOT NULL, "doctor_id" integer NOT NULL, "text" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_medical_records_text" CHECK (length(btrim("text")) > 0), CONSTRAINT "PK_medical_records" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_medical_records_patient_created_at" ON "medical_records" ("patient_id", "created_at")`);
        await queryRunner.query(`ALTER TABLE "medical_records" ADD CONSTRAINT "FK_medical_records_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_records" ADD CONSTRAINT "FK_medical_records_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_records" DROP CONSTRAINT "FK_medical_records_doctor"`);
        await queryRunner.query(`ALTER TABLE "medical_records" DROP CONSTRAINT "FK_medical_records_patient"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_medical_records_patient_created_at"`);
        await queryRunner.query(`DROP TABLE "medical_records"`);
    }

}
