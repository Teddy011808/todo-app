import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsers1792300000000 implements MigrationInterface {
  name = 'AddUsers1792300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(254) NOT NULL, "passwordHash" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "PK_users_id" PRIMARY KEY ("id"))`,
    );
    // Todos made before login existed have no owner, so nobody can see them
    await queryRunner.query(`ALTER TABLE "todos" ADD "ownerId" integer`);
    await queryRunner.query(
      `ALTER TABLE "todos" ADD CONSTRAINT "FK_todos_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_todos_owner" ON "todos" ("ownerId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_todos_owner"`);
    await queryRunner.query(
      `ALTER TABLE "todos" DROP CONSTRAINT "FK_todos_owner"`,
    );
    await queryRunner.query(`ALTER TABLE "todos" DROP COLUMN "ownerId"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
