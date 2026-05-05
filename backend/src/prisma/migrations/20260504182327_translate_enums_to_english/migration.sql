/*
  Warnings:

  - Made the column `observacao` on table `Historico` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Historico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitacaoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "observacao" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Historico_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "Solicitacao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Historico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Historico" ("acao", "criadoEm", "id", "observacao", "solicitacaoId", "usuarioId") SELECT "acao", "criadoEm", "id", "observacao", "solicitacaoId", "usuarioId" FROM "Historico";
DROP TABLE "Historico";
ALTER TABLE "new_Historico" RENAME TO "Historico";
CREATE TABLE "new_Solicitacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "dataDespesa" DATETIME NOT NULL,
    "justificativaRejeicao" TEXT,
    "solicitanteId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Solicitacao_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Solicitacao_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Solicitacao" ("atualizadoEm", "categoriaId", "criadoEm", "dataDespesa", "descricao", "id", "justificativaRejeicao", "solicitanteId", "status", "valor") SELECT "atualizadoEm", "categoriaId", "criadoEm", "dataDespesa", "descricao", "id", "justificativaRejeicao", "solicitanteId", "status", "valor" FROM "Solicitacao";
DROP TABLE "Solicitacao";
ALTER TABLE "new_Solicitacao" RENAME TO "Solicitacao";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
