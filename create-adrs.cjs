const fs = require('fs');
const path = require('path');

const adrs = [
  {
    file: '001-arquitetura-da-central-inteligente.md',
    title: 'ADR-001: Arquitetura da Central Inteligente',
    content: `# ADR-001: Arquitetura da Central Inteligente

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
`
  },
  {
    file: '002-nomenclatura-da-tabela-notifications.md',
    title: 'ADR-002: Por que utilizamos a tabela "notifications"',
    content: `# ADR-002: Por que utilizamos a tabela "notifications"

## Status
Aceito

## Contexto
Originalmente, as tabelas foram sugeridas com nomenclaturas atreladas à funcionalidade de UI, como \`smart_center_items\` e \`smart_center_reads\`.

## Motivos da Nomenclatura
Decidiu-se alterar para \`notifications\` e \`notification_reads\`. Essa decisão separa a entidade de dados da sua representação em tela. A "Central Inteligente" é apenas uma interface de visualização, enquanto as notificações são a entidade real e subjacente.

## Vantagens
- **Desacoplamento:** O banco não conhece o nome do produto/módulo de interface.
- **Genericidade:** Representa um conceito universal que desenvolvedores entendem rapidamente.

## Escalabilidade e Preparação para Múltiplos Canais
No futuro, uma \`notification\` não será lida exclusivamente na Central Inteligente. Ela poderá ser disparada via e-mail, Push, WhatsApp. Chamar a tabela raiz de \`notifications\` suporta organicamente tabelas de log como \`notification_deliveries\`, independentes do canal.
`
  },
  {
    file: '003-uso-de-jsonb-em-metadata.md',
    title: 'ADR-003: Uso de JSONB em metadata',
    content: `# ADR-003: Uso de JSONB em metadata

## Status
Aceito

## Contexto
Notificações frequentemente precisam armazenar informações de contexto variadas. Um alerta de presença exige \`projectId\` e \`employeeId\`. Uma notificação de sistema pode exigir \`version\` ou \`releaseNotesId\`.

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
Para chaves estrangeiras críticas de segurança/filtro primário (ex: \`user_id\`, \`company_id\`), campos obrigatórios de status (\`is_read\`, \`resolved_at\`) ou campos essenciais de filtragem de alto volume.
`
  },
  {
    file: '004-uso-de-notification-service.md',
    title: 'ADR-004: Uso de NotificationService',
    content: `# ADR-004: Uso de NotificationService

## Status
Aceito

## Contexto
Em arquiteturas iniciais, o React Hook (\`useSmartCenter\`) estava sendo responsável por armazenar estado, interagir com o cliente do Supabase, formatar dados e lidar com erros.

## Separação de Responsabilidades e SOLID
Foi decidido criar a classe \`NotificationService\`. O Serviço será o único responsável por se comunicar com a camada de dados (Supabase) ou APIs. O Hook (\`useSmartCenter\`) passa a ter a responsabilidade exclusiva de gerenciar o estado da UI e conectar o React ao Serviço.

## Vantagens
- **Testabilidade:** O serviço pode ser testado isoladamente sem a necessidade de um ambiente React.
- **Reutilização:** \`NotificationService\` pode ser injetado em Workers, CLI, ou outros contextos fora da UI (como rotas de API, se existirem).
- **Manutenção:** Mudanças no banco ou troca da biblioteca de requisição afetam apenas o Serviço, não os componentes ou hooks visuais.
`
  },
  {
    file: '005-estrategia-de-cache.md',
    title: 'ADR-005: Estratégia de Cache',
    content: `# ADR-005: Estratégia de Cache

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
`
  },
  {
    file: '006-estrategia-de-paginacao.md',
    title: 'ADR-006: Estratégia de Paginação',
    content: `# ADR-006: Estratégia de Paginação

## Status
Aceito

## Contexto
A tabela de notificações pode crescer vertiginosamente, alcançando centenas de milhares de registros. Um carregamento massivo quebraria o client-side e sobrecarregaria o banco.

## Cursor Pagination
Foi definida a estratégia de paginação baseada em cursor (ou Keysets) (e.g., buscando \`created_at < ultimo_registro_visto\`), em oposição à paginação tradicional de OFFSET/LIMIT.

## Por que não utilizar Offset?
À medida que a tabela cresce, o banco de dados tem que varrer todos os registros anteriores para aplicar o OFFSET. \`OFFSET 100000 LIMIT 20\` é altamente ineficiente e consome recursos intensos do PostgreSQL. A paginação por cursor permite uso direto de índices B-Tree para pular instantaneamente para o registro desejado, garantindo performance constante independentemente da quantidade de páginas já roladas.
`
  },
  {
    file: '007-estrategia-de-alertas-automaticos.md',
    title: 'ADR-007: Estratégia de Alertas Automáticos',
    content: `# ADR-007: Estratégia de Alertas Automáticos

## Status
Aceito

## Contexto
Problemas como "loop de verificação de faltas para todos os funcionários e obras" ocorrem quando o frontend centraliza as regras de varredura. Isso gera o famoso cenário de *N+1 Queries*.

## Por que utilizaremos RPCs/Funções SQL?
Mover a lógica de varredura (como o processamento diário de presenças, faltas, pendências) para funções SQL no banco (Functions / RPCs) ou Edge Functions elimina o overhead de comunicação de rede e otimiza radicalmente a velocidade, pois o banco varre e gera as notificações diretamente onde os dados residem.

- O Frontend solicita apenas o resultado.
- Previne lentidão na renderização e problemas de instabilidade na conexão do cliente com o banco.
`
  },
  {
    file: '008-preparacao-para-event-engine.md',
    title: 'ADR-008: Preparação para Event Engine',
    content: `# ADR-008: Preparação para Event Engine

## Status
Aceito

## Contexto
Eventualmente o KIVON precisará processar eventos centrais do sistema (criação de obra, pagamento, etc).

## Por que a V1 NÃO utilizará um Event Engine completo?
Na V1 o escopo precisa se manter realista e ágil. Construir barramentos de eventos assíncronos (Kafka/RabbitMQ) ou infraestrutura complexa de Event Sourcing atrasaria severamente o projeto e aumentaria o custo e complexidade operacional prematuramente.

## Preparação para migração V2/V3
A arquitetura foi preparada para suportar o conceito no futuro com:
- Nomenclatura genérica (\`notifications\`, \`metadata\`, \`source\`).
- Na V2/V3, inserções nessa tabela poderão ser acionadas por _Webhooks_ ou uma _Queue_ que processa um "Event" e decide se isso se transforma em uma notificação. O desacoplamento atual da UI permite que o backend de geração mude drasticamente sem que a UI perceba qualquer ruptura de compatibilidade.
`
  },
  {
    file: '009-preparacao-para-multiplos-canais.md',
    title: 'ADR-009: Preparação para Múltiplos Canais',
    content: `# ADR-009: Preparação para Múltiplos Canais

## Status
Aceito

## Contexto
O plano estratégico prevê que, além de alertas no painel do sistema (in-app), os usuários sejam comunicados por WhatsApp, Email e Push Notifications.

## Arquitetura Suportada
Sem remodelar a estrutura (\`notifications\`), no futuro poderemos adicionar a etapa de _Delivery_.
Ao invés do sistema simplesmente inserir um registro, o backend poderá:
1. Inserir a notificação base na tabela.
2. Ler uma tabela separada de \`user_preferences\` (que indicará opt-in de canais).
3. Uma rotina paralela/Edge Function assinará os novos registros dessa tabela (via Webhook/Database Trigger).
4. Essa rotina disparará a mensagem via SendGrid (Email), Twilio (SMS/WhatsApp) ou FCM (Push), inserindo o registro do sucesso em uma futura tabela \`notification_deliveries\`.
`
  },
  {
    file: '010-criterios-para-evolucao-da-central-inteligente.md',
    title: 'ADR-010: Critérios para evolução da Central Inteligente',
    content: `# ADR-010: Critérios para evolução da Central Inteligente

## Status
Aceito

## Contexto
É necessário alinhar as expectativas do que compõe cada fase evolutiva, para não inchar a V1 com features periféricas e complexas.

## O que pertence à V1:
- Geração reativa e sob demanda de Notificações, Alertas e Comunicados baseados no banco via RPC/Functions/Triggers simples.
- UI: Central Inteligente em Drawer In-App.
- Marcar como lida, categorias e contadores.
- Banco de dados desacoplado (tabela \`notifications\`).

## O que pertence à V2:
- **Notification Templates**: Gestão de templates de mensagens dinâmicas.
- **Preferências do Usuário**: Opt-in/opt-out granular por tipo de notificação.
- **Múltiplos Canais Básicos**: Push Notifications e Email.
- **Confirmação de Leitura Explícita**: Registros de auditoria ("Li e concordo").

## O que pertence à V3:
- **Event Engine Centralizado**: Barramento de mensageria que coordena todo evento interno.
- **Integrações Complexas**: WhatsApp, Slack, Teams.
- **Analytics Avançado**: Tracking de CTR de notificações operacionais, tempos de resolução avançados baseados em \`resolved_at\`.
`
  }
];

adrs.forEach(adr => {
  fs.writeFileSync(path.join('docs/adr', adr.file), adr.content);
});

console.log('Successfully created ADR files');
