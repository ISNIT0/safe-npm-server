import {MigrationInterface, QueryRunner} from "typeorm";

export class migration1544554022002 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "status_report" ADD "override" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "status_report" DROP COLUMN "override"`);
    }

}
