import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDoctorsTable1793474800000 implements MigrationInterface {
    name = 'CreateDoctorsTable1793474800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "doctors" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "crm" character varying(30) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "UQ_doctors_crm" UNIQUE ("crm"), CONSTRAINT "REL_653c27d1b10652eb0c7bbbc442" UNIQUE ("user_id"), CONSTRAINT "PK_doctors" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "doctors" ADD CONSTRAINT "FK_doctors_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctors" DROP CONSTRAINT "FK_doctors_user"`);
        await queryRunner.query(`DROP TABLE "doctors"`);
    }

}
