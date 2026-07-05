# ADR-009: Preparação para Múltiplos Canais

## Status
Aceito

## Contexto
O plano estratégico prevê que, além de alertas no painel do sistema (in-app), os usuários sejam comunicados por WhatsApp, Email e Push Notifications.

## Arquitetura Suportada
Sem remodelar a estrutura (`notifications`), no futuro poderemos adicionar a etapa de _Delivery_.
Ao invés do sistema simplesmente inserir um registro, o backend poderá:
1. Inserir a notificação base na tabela.
2. Ler uma tabela separada de `user_preferences` (que indicará opt-in de canais).
3. Uma rotina paralela/Edge Function assinará os novos registros dessa tabela (via Webhook/Database Trigger).
4. Essa rotina disparará a mensagem via SendGrid (Email), Twilio (SMS/WhatsApp) ou FCM (Push), inserindo o registro do sucesso em uma futura tabela `notification_deliveries`.
