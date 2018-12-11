import {MigrationInterface, QueryRunner} from "typeorm";

export class migration1544535779389 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "status_report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "packageName" character varying NOT NULL, "version" character varying NOT NULL, "automaticTestStatus" character varying NOT NULL, "completed" TIMESTAMP, CONSTRAINT "PK_589d851ea65b2ba502bd01bd5b4" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "status_report"`);
    }

}
