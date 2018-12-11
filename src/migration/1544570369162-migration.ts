import {MigrationInterface, QueryRunner} from "typeorm";

export class migration1544570369162 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "grade" character varying NOT NULL, "comments" character varying NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_99e4d0bea58cba73c57f935a546" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "package_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "packageName" character varying NOT NULL, "version" character varying NOT NULL, "reportId" uuid, CONSTRAINT "REL_2a930911ecbd37ca1f5aa5ddcf" UNIQUE ("reportId"), CONSTRAINT "PK_af48136598fd733f07887599a99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "package_version" ADD CONSTRAINT "FK_2a930911ecbd37ca1f5aa5ddcff" FOREIGN KEY ("reportId") REFERENCES "report"("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "package_version" DROP CONSTRAINT "FK_2a930911ecbd37ca1f5aa5ddcff"`);
        await queryRunner.query(`DROP TABLE "package_version"`);
        await queryRunner.query(`DROP TABLE "report"`);
    }

}
