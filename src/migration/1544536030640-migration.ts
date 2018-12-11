import {MigrationInterface, QueryRunner} from "typeorm";

export class migration1544536030640 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "status_report" RENAME COLUMN "completed" TO "automaticTestCompletedAt"`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "status_report" RENAME COLUMN "automaticTestCompletedAt" TO "completed"`);
    }

}
