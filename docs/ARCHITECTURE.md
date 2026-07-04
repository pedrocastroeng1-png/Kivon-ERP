# KIVON - Arquitetura do ERP

## Diretriz central

KIVON usa React somente como camada de interface, navegacao, validacao basica e consumo de contratos do Supabase. Toda regra critica deve viver no PostgreSQL/Supabase por meio de functions, triggers, views e policies RLS.

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Supabase Auth
- Supabase Storage privado
- PostgreSQL
- Vercel

## Organizacao do frontend

- `src/app`: providers globais e roteamento.
- `src/features`: modulos por dominio, como `auth`, `daily-register`, `admin`.
- `src/shared`: componentes reutilizaveis, tipos, configuracoes e bibliotecas.
- `src/styles`: estilos globais e entrada do Tailwind.
- `supabase/migrations`: estrutura versionada do banco.
- `docs`: decisoes de arquitetura e contratos do sistema.

## Organizacao do banco

- `supabase/migrations/0001_kivon_foundation.sql`: schema V1, constraints, indices, views, functions planejadas, triggers de `updated_at`, RLS e bucket privado.
- `docs/DATABASE_DESIGN.md`: DER, dicionario de dados, relacionamentos, auditoria e storage.
- `docs/DATABASE_RULES.md`: regras de negocio que devem permanecer no banco.

## Perfis

Existem apenas dois perfis:

- `admin`: acesso completo ao ERP.
- `operador`: acesso exclusivo ao cadastro de diarias.

O frontend possui guardas de rota para experiencia de usuario, mas a seguranca real deve ser garantida por RLS e functions no Supabase.

## Modulos previstos

- Inicio
- Obras
- Dashboard
- Relatorios
- Funcionarios
- Gerenciamento de Obras
- Usuarios
- Cadastro de Diarias

## Regras que devem permanecer no banco

- Calculo de diaria por turno.
- Valor da diaria conforme cargo do funcionario.
- Impedimento de exclusao fisica de obras e funcionarios.
- Auditoria de alteracoes.
- Validacao de foto obrigatoria no primeiro registro da manha.
- Validacao de acesso por perfil.
- Escrita e leitura de fotos em bucket privado.

## Contrato da foto

A foto deve ser salva em bucket privado no Supabase Storage e vinculada a:

- funcionario
- obra
- data
- usuario responsavel pelo registro
- horario da captura

Nunca gerar URL publica para fotografia. A leitura deve ocorrer apenas via usuario autorizado e, quando necessario, por signed URLs temporarias geradas sob policy adequada.
