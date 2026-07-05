# Changelog

## [1.0.0] - 2026-07-04
### Adicionado
- Autenticação e Gestão de Usuários (Login, Reset de Senha, Update de Senha).
- Interface de Dashboard Administrativo (Indicadores de Presença, Gráficos).
- Cadastro de Diárias (Registro de presença com fotos, seleção de turno, filtro de colaboradores).
- Gestão de Obras (CRUD Completo de Projetos).
- Gestão de Funcionários (CRUD Completo de Funcionários e Vínculos em Obras).
- Gestão de Cargos (CRUD de Cargos e Valores das Diárias).
- Fechamento Diário (Validação de presença e fotos com aprovação/rejeição).
- Relatórios (Geração de consolidados de fechamento e exportação para PDF).
- Base de dados Supabase com políticas de segurança (RLS).
- Funcionalidades offline e PWA via vite-plugin-pwa.
- Layout padronizado em padrão Dark Mode focado em acessibilidade e estética "KIVON ERP".

### Removido
- Telas de mock.
- Códigos mortos da estrutura inicial.
- Assets desnecessários.

### Modificado
- Design System consolidado com Tailwind CSS.
- Abstração de API do Supabase em features dedicadas.
- Melhoria geral da Interface de Login com marca d'água elegante, bordas sutis e tipografia minimalista.
