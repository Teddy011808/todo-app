import { MigrationInterface, QueryRunner } from 'typeorm';

export class OwnerRequired1792500000000 implements MigrationInterface {
  name = 'OwnerRequired1792500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Todos from before login had no owner and nobody could see them
    await queryRunner.query(`DELETE FROM "todos" WHERE "ownerId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "todos" ALTER COLUMN "ownerId" SET NOT NULL`,
    );
    // The old shared profile (id 1) belonged to nobody; each user gets their own
    await queryRunner.query(`DELETE FROM "profile"`);
    await queryRunner.query(
      `ALTER TABLE "profile" ADD CONSTRAINT "FK_profile_user" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profile" DROP CONSTRAINT "FK_profile_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "todos" ALTER COLUMN "ownerId" DROP NOT NULL`,
    );
  }
}
