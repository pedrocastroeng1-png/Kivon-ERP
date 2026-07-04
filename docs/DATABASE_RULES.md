# KIVON - Regras de Banco

## Filosofia

O PostgreSQL e o nucleo da regra de negocio. O frontend deve chamar functions ou consultar views seguras, sem reproduzir regra critica em TypeScript.

## Modelo V1

A modelagem completa esta em `docs/DATABASE_DESIGN.md` e a migracao-base esta em `supabase/migrations/0001_kivon_foundation.sql`.

## Diarias

- Turnos permitidos: `manha`, `tarde`.
- Cada turno vale `0.5`.
- Manha + tarde totaliza `1.0`.
- O valor monetario deve ser resolvido no banco com base no cargo ativo do funcionario.
- Funcionarios devem ser retornados em ordem alfabetica por view ou function.
- Nao existe ordenacao manual.
- Nao pode haver dois registros para o mesmo funcionario, obra, data e turno.

## Foto

- Obrigatoria somente no primeiro registro da manha do funcionario em uma obra/data.
- Se ja existir foto valida para funcionario + obra + data, o banco deve permitir novo registro de manha sem nova captura.
- Registro da tarde nunca exige foto.
- O bucket deve ser privado: `presence-photos`.
- A tabela `presence_photos` guarda o path do objeto, nunca URL publica.

## Ativacao

- Funcionarios nunca devem ser excluidos fisicamente.
- Obras nunca devem ser excluidas fisicamente.
- Usar `active` e registrar auditoria em toda mudanca.

## Auditoria

Toda alteracao relevante deve registrar:

- tabela afetada;
- registro afetado;
- operacao;
- usuario autenticado;
- valores anteriores;
- valores novos;
- data/hora.

## RLS

- ADMIN tem acesso total.
- OPERADOR registra presenca e fotos, sem acesso administrativo.
- Leitura do operador deve ser limitada aos dados necessarios ao cadastro de diarias.
