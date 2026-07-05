# ADR-003: Uso de JSONB em metadata

## Status
Aceito

## Contexto
Notificações frequentemente precisam armazenar informações de contexto variadas. Um alerta de presença exige `projectId` e `employeeId`. Uma notificação de sistema pode exigir `version` ou `releaseNotesId`.

## Benefícios
- **Flexibilidade:** Permite adicionar novos campos de contexto sem precisar alterar o schema do banco (DDL).
- **Indexação:** PostgreSQL possui suporte eficiente para buscas em campos JSONB (índices GIN).
- **Padronização:** Mantém o schema da tabela principal enxuto e conciso.

## Limitações
- Estrutura mais livre pode gerar inconsistência caso não haja tipagem no frontend (TypeScript) ou validações estruturais.
- Consultas profundas no JSONB podem ser mais complexas e lentas que colunas escalares tradicionais, se não indexadas corretamente.

## Quando Utilizar
Para atributos contextuais específicos do tipo da notificação, IDs de navegação e payload de dados que não são chaves primárias de agregação globais ou filtros primários frequentes.

## Quando NÃO Utilizar
Para chaves estrangeiras críticas de segurança/filtro primário (ex: `user_id`, `company_id`), campos obrigatórios de status (`is_read`, `resolved_at`) ou campos essenciais de filtragem de alto volume.
