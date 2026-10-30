import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkShiftsTable1793561200000 implements MigrationInterface {
    name = 'CreateWorkShiftsTable1793561200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "work_shifts" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "doctor_id" integer NOT NULL, "week_day" smallint NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "slot_duration_minutes" smallint NOT NULL, CONSTRAINT "CHK_work_shifts_slot_duration" CHECK ("slot_duration_minutes" > 0), CONSTRAINT "CHK_work_shifts_time_order" CHECK ("start_time" < "end_time"), CONSTRAINT "CHK_work_shifts_week_day" CHECK ("week_day" BETWEEN 0 AND 6), CONSTRAINT "PK_work_shifts" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_work_shifts_doctor_week_day" ON "work_shifts" ("doctor_id", "week_day")`);
        await queryRunner.query(`ALTER TABLE "work_shifts" ADD CONSTRAINT "FK_work_shifts_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "work_shifts" DROP CONSTRAINT "FK_work_shifts_doctor"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_work_shifts_doctor_week_day"`);
        await queryRunner.query(`DROP TABLE "work_shifts"`);
    }

}
