# ADR-001: Arquitetura da Central Inteligente

## Status
Aceito

## Problema
A Central Inteligente precisava ser projetada para atuar não apenas como um simples agrupador de mensagens, mas como um mecanismo escalável de eventos, notificações e comunicados do ERP. Precisávamos de uma arquitetura limpa, manutenível e performática para suportar o crescimento das operações.

## Contexto
Durante o desenvolvimento da V1 da Central Inteligente, constatou-se o risco de acoplamento entre a interface (o que o usuário enxerga como "Central Inteligente") e a infraestrutura de dados. Além disso, a lógica de negócio estava inicialmente acoplada aos componentes React e Hooks.

## Opções Avaliadas
1. **Modelagem monolítica atrelada à interface:** Criar tabelas com nomes estritamente ligados à interface e manter chamadas diretas no React.
2. **Separação em Camadas (Domain-Driven):** Separar a infraestrutura de dados (Notifications genéricas), a lógica de negócios (NotificationService) e a interface (Central Inteligente), aplicando padrões de SOLID.

## Solução Escolhida
Optamos pela separação em camadas e estruturação baseada em domínios abstratos. A Central Inteligente será exclusivamente a interface do usuário. A infraestrutura será composta pelos domínios: Event -> Rule -> Notification -> Delivery. A lógica ficará encapsulada em Services, isolando a comunicação com o banco de dados.

## Consequências
- Maior testabilidade e reutilização de código.
- Banco de dados agnóstico à interface atual, facilitando rebranding ou criação de novas interfaces.
- Facilidade em acoplar novos canais de notificação no futuro.
