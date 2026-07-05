# ADR-002: Por que utilizamos a tabela "notifications"

## Status
Aceito

## Contexto
Originalmente, as tabelas foram sugeridas com nomenclaturas atreladas à funcionalidade de UI, como `smart_center_items` e `smart_center_reads`.

## Motivos da Nomenclatura
Decidiu-se alterar para `notifications` e `notification_reads`. Essa decisão separa a entidade de dados da sua representação em tela. A "Central Inteligente" é apenas uma interface de visualização, enquanto as notificações são a entidade real e subjacente.

## Vantagens
- **Desacoplamento:** O banco não conhece o nome do produto/módulo de interface.
- **Genericidade:** Representa um conceito universal que desenvolvedores entendem rapidamente.

## Escalabilidade e Preparação para Múltiplos Canais
No futuro, uma `notification` não será lida exclusivamente na Central Inteligente. Ela poderá ser disparada via e-mail, Push, WhatsApp. Chamar a tabela raiz de `notifications` suporta organicamente tabelas de log como `notification_deliveries`, independentes do canal.
