import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackgroundJobs1792600000000 implements MigrationInterface {
  name = 'BackgroundJobs1792600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Existing todos start their 30-day cleanup clock now
    await queryRunner.query(
      `ALTER TABLE "todos" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE TABLE "activity" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "message" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_activity" PRIMARY KEY ("id"), CONSTRAINT "FK_activity_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_userId" ON "activity" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "activity"`);
    await queryRunner.query(`ALTER TABLE "todos" DROP COLUMN "updatedAt"`);
  }
}
