# ADR-005: Estratégia de Cache

## Status
Aceito

## Contexto
O Drawer da Central Inteligente é um elemento muito acessado. Se cada abertura acionasse uma nova consulta ao banco para buscar notificações e contadores não lidos, o sistema sofreria sobrecarga desnecessária.

## SWR (Stale-While-Revalidate)
Para a listagem e contagem, utilizaremos o conceito SWR ou bibliotecas como React Query / SWR, que mantêm os dados cacheados na memória e os exibem imediatamente ao usuário, validando e atualizando a lista em background.

## Realtime
A estratégia de cache é combinada com assinaturas Realtime do Supabase. Assim que um evento de nova notificação ocorre via banco, o cache do frontend é invalidado ou atualizado pontualmente, mantendo o usuário atualizado sem a necessidade de _polling_ constante.

## Invalidação e Performance
- Invalidação baseada em eventos (novas inserções via websocket) ou ações do usuário (marcar como lida).
- Impacto massivo em ganho de performance na percepção do usuário (carregamento instantâneo) e alívio de requisições de leitura no servidor de banco de dados.
