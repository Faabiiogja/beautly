-- supabase/migrations/20260315000001_fix_rls_infinite_recursion.sql
--
-- PROBLEMA: A política tu_tenant_isolation consultava tenant_users para
-- autorizar acesso a tenant_users → recursão infinita (erro 42P17).
-- Isso causava o loop de login: getAdminSession() recebia erro ao consultar
-- tenant_users, retornava null, e requireAdmin() redirecionava para login.
--
-- CORREÇÃO: Simplificar a política de tenant_users para user_id = auth.uid().
-- Cada admin vê apenas sua própria linha.
-- As políticas das outras tabelas (que consultam tenant_users como subquery)
-- continuam funcionando corretamente — sem recursão, pois consultam uma
-- tabela diferente daquela que está sendo protegida.

DROP POLICY IF EXISTS tu_tenant_isolation ON tenant_users;

CREATE POLICY tu_tenant_isolation ON tenant_users
  FOR ALL USING (user_id = auth.uid());
