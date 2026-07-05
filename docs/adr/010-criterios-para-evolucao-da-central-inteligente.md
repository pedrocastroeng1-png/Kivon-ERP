# ADR-010: Critérios para evolução da Central Inteligente

## Status
Aceito

## Contexto
É necessário alinhar as expectativas do que compõe cada fase evolutiva, para não inchar a V1 com features periféricas e complexas.

## O que pertence à V1:
- Geração reativa e sob demanda de Notificações, Alertas e Comunicados baseados no banco via RPC/Functions/Triggers simples.
- UI: Central Inteligente em Drawer In-App.
- Marcar como lida, categorias e contadores.
- Banco de dados desacoplado (tabela `notifications`).

## O que pertence à V2:
- **Notification Templates**: Gestão de templates de mensagens dinâmicas.
- **Preferências do Usuário**: Opt-in/opt-out granular por tipo de notificação.
- **Múltiplos Canais Básicos**: Push Notifications e Email.
- **Confirmação de Leitura Explícita**: Registros de auditoria ("Li e concordo").

## O que pertence à V3:
- **Event Engine Centralizado**: Barramento de mensageria que coordena todo evento interno.
- **Integrações Complexas**: WhatsApp, Slack, Teams.
- **Analytics Avançado**: Tracking de CTR de notificações operacionais, tempos de resolução avançados baseados em `resolved_at`.
