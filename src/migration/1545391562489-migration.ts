import {MigrationInterface, QueryRunner} from "typeorm";

export class migration1545391562489 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "grade" character varying NOT NULL, "comments" character varying NOT NULL, "date" TIMESTAMP NOT NULL, "by" character varying NOT NULL, "packageVersionId" uuid, CONSTRAINT "PK_99e4d0bea58cba73c57f935a546" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "package_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "packageName" character varying NOT NULL, "version" character varying NOT NULL, CONSTRAINT "PK_af48136598fd733f07887599a99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "report" ADD CONSTRAINT "FK_ba05c63326b21dc51f673046772" FOREIGN KEY ("packageVersionId") REFERENCES "package_version"("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "report" DROP CONSTRAINT "FK_ba05c63326b21dc51f673046772"`);
        await queryRunner.query(`DROP TABLE "package_version"`);
        await queryRunner.query(`DROP TABLE "report"`);
    }

}
