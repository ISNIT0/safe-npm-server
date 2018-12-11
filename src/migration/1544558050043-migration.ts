import {MigrationInterface, QueryRunner} from "typeorm";

export class migration1544558050043 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "review" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "grade" character varying NOT NULL, "reviewer" character varying NOT NULL, "comments" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL, "packageVersionId" uuid, CONSTRAINT "PK_2e4299a343a81574217255c00ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "package_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "packageName" character varying NOT NULL, "version" character varying NOT NULL, "automaticTestStatus" character varying NOT NULL, "reviewsId" uuid, CONSTRAINT "PK_af48136598fd733f07887599a99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_33e9ba5d284b127ef64b706f21e" FOREIGN KEY ("packageVersionId") REFERENCES "package_version"("id")`);
        await queryRunner.query(`ALTER TABLE "package_version" ADD CONSTRAINT "FK_bff1f6c3ae28d98cbcea13e16c8" FOREIGN KEY ("reviewsId") REFERENCES "review"("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "package_version" DROP CONSTRAINT "FK_bff1f6c3ae28d98cbcea13e16c8"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_33e9ba5d284b127ef64b706f21e"`);
        await queryRunner.query(`DROP TABLE "package_version"`);
        await queryRunner.query(`DROP TABLE "review"`);
    }

}
