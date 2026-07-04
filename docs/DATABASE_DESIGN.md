# KIVON ERP - Database Design

Este documento especifica o design atualizado do banco de dados relacional PostgreSQL do KIVON ERP no Supabase, refletindo as melhorias aplicadas nas migrações V1, V2 e V3.

## Arquitetura Geral

O KIVON adota o PostgreSQL e o Supabase como núcleo de lógica e dados.
O esquema utiliza schemas padrão, enums e UUIDs como chaves. A auditoria e soft-deletion (Inativação Lógica) garantem que os dados não sejam perdidos.

## Tabelas e Domínios

### Enums
- `app_role`: 'admin', 'operador'.
- `shift_type`: 'manha', 'tarde'.
- `audit_operation`: 'insert', 'update', 'delete'.
- `presence_status`: 'PRESENTE', 'FALTOU', 'ATESTADO', 'FERIAS', 'FOLGA'.

### DER e Relacionamentos

A base é fortemente tipada e normalizada, utilizando:
- **`profiles`** & **`users`**: Gerenciamento de perfis e vínculo com o Supabase Auth.
- **`job_roles`**, **`employees`**, **`projects`**: Entidades core. Relacionamento N:N entre `projects` e `employees` através de **`project_employees`**.
- **`presence`**: Tabela central para o registro de presenças. Possui vínculo com a foto, funcionário, obra, e status da presença.
- **`presence_photos`**: Registro da imagem (blob armazenado no Storage). Vincula a obra, data, funcionário, e o operador que tirou a foto.
- **`audit_logs`**: Tabela de rastreamento de modificações (Insert, Update, Delete) populada via Trigger.

## Dicionário de Dados Atualizado

### `presence`
Responsável por armazenar o diário de presença/ausência.
- `id`: PK, UUID.
- `project_id`, `employee_id`: FKs restritas.
- `shift`: Enum `manha` ou `tarde`. Mantido para evitar perdas ou ambiguidades e suportar múltiplas marcações.
- `presence_date`: Data da presença.
- `presence_time`: Horário exato (time) para registros finos (opcional).
- `status`: Enum `presence_status` ('PRESENTE', 'FALTOU', 'ATESTADO', 'FERIAS', 'FOLGA'). Substitui lógicas binárias.
- `photo_id`: Referência para a foto capturada (em caso de 'PRESENTE').
- `registered_by`: Referência para quem fez o registro.

### `audit_logs`
- `table_name`: string com nome da tabela.
- `record_id`: UUID do registro impactado.
- `operation`: Tipo da operação (`insert`, `update`, `delete`).
- `changed_by`: UUID do usuário que realizou a operação.
- `old_data`, `new_data`: JSONB contendo o diff completo da entidade afetada.
- `changed_at`: Momento da operação.

### Views (Atualizadas)
- `vw_presenca_hoje`: Registros do dia corrente, incluindo `status` e `presence_time`.
- `vw_total_diarias`: Filtra as diárias e calcula os ganhos apenas para registros onde `status = 'PRESENTE'`.
- `vw_funcionarios_ativos`, `vw_obras_ativas`, `vw_fotos_presenca`: Views mantidas para compatibilidade e performance.

## Funções (RPCs) e Triggers

### Triggers de Auditoria e Soft-Delete
- `registrar_auditoria()`: Trigger acionada em operações INSERT, UPDATE e DELETE nas tabelas principais para popular `audit_logs`.
- `prevent_deletion()`: Impede DELETE físicos em `projects`, `employees`, `job_roles`, `project_employees` forçando inativação via coluna `active = false`.
- `set_updated_at()`: Garante atualização em `updated_at`.

### RPCs
- `calcular_diaria()`: Considera explicitamente registros de `status = 'PRESENTE'`.
- `registrar_presenca()`: Valida a obrigatoriedade da foto caso seja o primeiro registro, ou validações do `status`.

## Índices de Performance

A estrutura conta com diversos índices focados nas consultas frequentes (queries de dashboard, filtragem de relatórios e joins):
- `idx_presence_status` (presence)
- `idx_presence_project_date` e `idx_presence_employee_date`
- `idx_audit_logs_table_name` e `idx_audit_logs_operation`
- Índices de Active State para soft-deletes.
