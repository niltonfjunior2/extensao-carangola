# Automações de DevOps e Keepalive

O arquivo `supabase-keepalive.yml` neste diretório contém a automação de ping preventivo do PostgreSQL (gerando escrita WAL real para impedir a suspensão por inatividade do plano gratuito do Supabase).

### Como ativar no GitHub Actions:
1. Caso deseje executar essa automação no repositório, certifique-se de que o seu Personal Access Token (PAT) do GitHub possua o escopo **`workflow`** habilitado em:
   `GitHub -> Settings -> Developer settings -> Personal access tokens -> Edit -> marque 'workflow'`.
2. Mova o arquivo para a pasta de workflows:
   ```bash
   mkdir -p .github/workflows
   cp docs/devops/supabase-keepalive.yml .github/workflows/
   git add .github/workflows/
   git commit -m "ci: ativar keepalive do supabase"
   git push origin main
   ```
3. Configure os segredos no repositório (`Settings -> Secrets and variables -> Actions`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
