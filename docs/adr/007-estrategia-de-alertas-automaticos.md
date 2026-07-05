# ADR-007: Estratégia de Alertas Automáticos

## Status
Aceito

## Contexto
Problemas como "loop de verificação de faltas para todos os funcionários e obras" ocorrem quando o frontend centraliza as regras de varredura. Isso gera o famoso cenário de *N+1 Queries*.

## Por que utilizaremos RPCs/Funções SQL?
Mover a lógica de varredura (como o processamento diário de presenças, faltas, pendências) para funções SQL no banco (Functions / RPCs) ou Edge Functions elimina o overhead de comunicação de rede e otimiza radicalmente a velocidade, pois o banco varre e gera as notificações diretamente onde os dados residem.

- O Frontend solicita apenas o resultado.
- Previne lentidão na renderização e problemas de instabilidade na conexão do cliente com o banco.
