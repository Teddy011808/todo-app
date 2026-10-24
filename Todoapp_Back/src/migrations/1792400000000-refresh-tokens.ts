import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokens1792400000000 implements MigrationInterface {
  name = 'AddRefreshTokens1792400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "tokenHash" character varying(64) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_refresh_tokens_hash" UNIQUE ("tokenHash"), CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"), CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
