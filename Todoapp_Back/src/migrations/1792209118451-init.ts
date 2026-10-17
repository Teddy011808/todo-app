import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1792209118451 implements MigrationInterface {
  name = 'Init1792209118451';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "profile" ("id" integer NOT NULL, "username" character varying(30) NOT NULL, "displayName" character varying(80) NOT NULL, "email" character varying(254) NOT NULL DEFAULT '', CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "todos" ("id" SERIAL NOT NULL, "title" character varying(200) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'TODO', "starred" boolean NOT NULL DEFAULT false, "position" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_ca8cafd59ca6faaf67995344225" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "todos"`);
    await queryRunner.query(`DROP TABLE "profile"`);
  }
}
