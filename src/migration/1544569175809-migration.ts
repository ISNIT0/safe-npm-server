import {MigrationInterface, QueryRunner} from "typeorm";

export class migration1544569175809 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_33e9ba5d284b127ef64b706f21e"`);
        await queryRunner.query(`ALTER TABLE "package_version" DROP CONSTRAINT "FK_bff1f6c3ae28d98cbcea13e16c8"`);
        await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "reviewer"`);
        await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "packageVersionId"`);
        await queryRunner.query(`ALTER TABLE "package_version" DROP COLUMN "automaticTestStatus"`);
        await queryRunner.query(`ALTER TABLE "package_version" DROP COLUMN "reviewsId"`);
        await queryRunner.query(`ALTER TABLE "review" ADD "updatedAt" TIMESTAMP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "package_version" ADD "reviewsId" uuid`);
        await queryRunner.query(`ALTER TABLE "package_version" ADD "automaticTestStatus" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "review" ADD "packageVersionId" uuid`);
        await queryRunner.query(`ALTER TABLE "review" ADD "createdAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "review" ADD "reviewer" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "package_version" ADD CONSTRAINT "FK_bff1f6c3ae28d98cbcea13e16c8" FOREIGN KEY ("reviewsId") REFERENCES "review"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_33e9ba5d284b127ef64b706f21e" FOREIGN KEY ("packageVersionId") REFERENCES "package_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
