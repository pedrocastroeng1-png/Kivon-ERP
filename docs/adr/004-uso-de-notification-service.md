# ADR-004: Uso de NotificationService

## Status
Aceito

## Contexto
Em arquiteturas iniciais, o React Hook (`useSmartCenter`) estava sendo responsável por armazenar estado, interagir com o cliente do Supabase, formatar dados e lidar com erros.

## Separação de Responsabilidades e SOLID
Foi decidido criar a classe `NotificationService`. O Serviço será o único responsável por se comunicar com a camada de dados (Supabase) ou APIs. O Hook (`useSmartCenter`) passa a ter a responsabilidade exclusiva de gerenciar o estado da UI e conectar o React ao Serviço.

## Vantagens
- **Testabilidade:** O serviço pode ser testado isoladamente sem a necessidade de um ambiente React.
- **Reutilização:** `NotificationService` pode ser injetado em Workers, CLI, ou outros contextos fora da UI (como rotas de API, se existirem).
- **Manutenção:** Mudanças no banco ou troca da biblioteca de requisição afetam apenas o Serviço, não os componentes ou hooks visuais.
