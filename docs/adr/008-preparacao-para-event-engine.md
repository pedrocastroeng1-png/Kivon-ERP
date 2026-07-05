# ADR-008: Preparação para Event Engine

## Status
Aceito

## Contexto
Eventualmente o KIVON precisará processar eventos centrais do sistema (criação de obra, pagamento, etc).

## Por que a V1 NÃO utilizará um Event Engine completo?
Na V1 o escopo precisa se manter realista e ágil. Construir barramentos de eventos assíncronos (Kafka/RabbitMQ) ou infraestrutura complexa de Event Sourcing atrasaria severamente o projeto e aumentaria o custo e complexidade operacional prematuramente.

## Preparação para migração V2/V3
A arquitetura foi preparada para suportar o conceito no futuro com:
- Nomenclatura genérica (`notifications`, `metadata`, `source`).
- Na V2/V3, inserções nessa tabela poderão ser acionadas por _Webhooks_ ou uma _Queue_ que processa um "Event" e decide se isso se transforma em uma notificação. O desacoplamento atual da UI permite que o backend de geração mude drasticamente sem que a UI perceba qualquer ruptura de compatibilidade.
