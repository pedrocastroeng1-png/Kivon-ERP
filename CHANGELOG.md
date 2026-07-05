# Changelog

## [1.0.1] - 2026-07-04
### Modificado
- **PWA (Arquitetura):** Alterada a estratégia de atualização do Service Worker de `autoUpdate` para `prompt`. Implementado aviso visual (`ReloadPrompt`) para notificar o usuário quando há uma nova versão disponível, prevenindo execução de JavaScript desatualizado e quebra de contratos de API.

### Corrigido
- **Visualização de Evidências Fotográficas:** Corrigido problema em que a foto de presença não carregava devido ao uso de `getPublicUrl` em bucket privado. A geração da URL foi substituída por `createSignedUrl` com expiração de 5 minutos.
- Adicionado tratamento de erro visual para links expirados ou inválidos (mensagem "Evidência indisponível.").
- **Refatoração:** Criada a camada de serviço `ImageService` (`src/shared/services/ImageService.ts`) para centralizar a comunicação com o storage, padronizando a geração e upload de arquivos. Implementada também uma estratégia de cache em memória para as Signed URLs reduzindo requisições desnecessárias.
- **Identidade Visual:** Reprojeto completo da Splash Screen com fundo sólido (#090909), logo centralizada com animação suave de escala e fade-in, e um novo indicador de carregamento minimalista. Implementado fallback robusto para garantir a exibição da logo local (`/logo-kivon-white.png`) caso o carregamento remoto falhe, eliminando o erro de imagem quebrada e garantindo consistência no PWA.
- **PWA:** Atualizado `vite.config.ts` com máscara de ícone (`purpose: 'any maskable'`) para compatibilidade e melhoria da experiência de instalação.

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
