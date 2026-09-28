-- Spec 3 — Inventário. Sub-parte A. Unicidade de itens empilháveis.
-- Ver .kiro/specs/inventario/design.md §1.2.
--
-- Itens empilháveis (consumíveis/recursos) devem ter no máximo UMA linha por
-- personagem quando NÃO equipados, com quantity acumulando. Isso dá segurança ao
-- empilhamento do grantLoot e das ações de inventário.
--
-- IMPORTANTE: um índice único simples sobre (character_id, item_id) barraria também
-- os EQUIPÁVEIS repetidos (que devem ficar em 1 linha por unidade). Como o índice
-- parcial do Postgres não pode referenciar outra tabela (items.is_stackable), não
-- há predicado de índice que distinga "stackável" de "equipável" apenas por colunas
-- de character_inventory.
--
-- Decisão: o empilhamento é garantido na CAMADA DE APLICAÇÃO (grantLoot/ações fazem
-- "ler linha existente do stackável e somar quantity, senão inserir"). Portanto NÃO
-- criamos índice único aqui. Esta migration fica como marcador da decisão (no-op),
-- para manter o histórico coerente com o design.

-- (sem alteração de schema — empilhamento controlado no backend)
SELECT 1;
