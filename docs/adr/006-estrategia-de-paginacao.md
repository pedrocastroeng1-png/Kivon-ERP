# ADR-006: Estratégia de Paginação

## Status
Aceito

## Contexto
A tabela de notificações pode crescer vertiginosamente, alcançando centenas de milhares de registros. Um carregamento massivo quebraria o client-side e sobrecarregaria o banco.

## Cursor Pagination
Foi definida a estratégia de paginação baseada em cursor (ou Keysets) (e.g., buscando `created_at < ultimo_registro_visto`), em oposição à paginação tradicional de OFFSET/LIMIT.

## Por que não utilizar Offset?
À medida que a tabela cresce, o banco de dados tem que varrer todos os registros anteriores para aplicar o OFFSET. `OFFSET 100000 LIMIT 20` é altamente ineficiente e consome recursos intensos do PostgreSQL. A paginação por cursor permite uso direto de índices B-Tree para pular instantaneamente para o registro desejado, garantindo performance constante independentemente da quantidade de páginas já roladas.
