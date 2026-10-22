-- ==============================================================================
-- MIGRAÇÃO ADITIVA: SUPORTE A AUTENTICAÇÃO COM GOOGLE E VALIDAÇÃO PROFISSIONAL
-- ==============================================================================
-- Esta migração complementa a tabela 'usuarios' sem remover dados preexistentes.
-- Permite que usuários autenticados via Google não precisem de senha_hash,
-- mantendo a obrigatoriedade de senha apenas para contas locais.
-- ==============================================================================

BEGIN;

-- 1. Permite senha nula para contas criadas via provedores externos (Google)
ALTER TABLE usuarios ALTER COLUMN senha_hash DROP NOT NULL;

-- 2. Adiciona o identificador único do Google (google_id)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- 3. Identifica a origem do cadastro ('local', 'google' ou 'hibrido')
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS metodo_auth VARCHAR(20) NOT NULL DEFAULT 'local';

-- 4. Registro profissional do nutricionista (CRN) para validação
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS crn VARCHAR(50);

-- 5. Status de aprovação para contas de nutricionistas ('aprovado', 'pendente', 'rejeitado')
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status_aprovacao VARCHAR(30) NOT NULL DEFAULT 'aprovado';

-- 6. Validação de integridade: contas locais exigem senha; contas Google exigem google_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_usuarios_auth_metodo'
    ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT chk_usuarios_auth_metodo CHECK (
            (metodo_auth = 'local' AND senha_hash IS NOT NULL) OR
            (metodo_auth = 'google' AND google_id IS NOT NULL) OR
            (metodo_auth = 'hibrido' AND senha_hash IS NOT NULL AND google_id IS NOT NULL)
        );
    END IF;
END $$;

COMMIT;
