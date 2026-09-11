# Tarefas — Sistema de Perícias

Ordem de execução (cada bloco é verificável isoladamente).

## Banco
- [ ] 1. Migration `create_skills_catalog` (tabela + RLS SELECT pública + grants).
- [ ] 2. Migration `add_skill_points_to_attributes` (field_skill_points, combat_skill_points).
- [ ] 3. Seed idempotente de `skills_catalog`: 14 perícias de campo + 12 de combate
       com atributo base e requisito de MG (valores do Volume III).
- [ ] 4. `db push` e verificar no remoto (contagem = 26; colunas criadas).

## Backend
- [ ] 5. `services/skills.js`: iniciais por classe + validação de alocação (criação e in-game).
- [ ] 6. `GET /skills/catalog` (autenticado, leitura).
- [ ] 7. `POST /characters`: criar as 3 iniciais (nível 2) + aplicar alocações da
       criação + gravar pontos restantes em `character_attributes`. Retrocompatível
       sem `skills` (guarda todos os pontos como disponíveis).
- [ ] 8. `POST /characters/:id/skills/allocate`: valida propriedade, pontos,
       requisito de atributo e teto 10; aplica e debita pontos.
- [ ] 9. `/enter`: incluir pontos de perícia disponíveis no payload
       (`character_skills` já é retornado).

## Frontend
- [ ] 10. `skillService.getCatalog()` + `skillService.allocate()`;
        `characterService.create` enviando `skills`.
- [ ] 11. Nova etapa de perícias na criação (abas Campo/Combate, contadores,
        requisitos, iniciais fixas nível 2).
- [ ] 12. Página "Perícias" in-game INTERATIVA (lista por tipo + distribuição de
        pontos disponíveis, +/-, confirmação).

## Verificação
- [ ] 13. Teste e2e por classe: iniciais nível 2; alocação na criação; alocação
        in-game válida e inválida (requisito não atendido, pontos insuficientes,
        teto 10); pontos restantes corretos; `GET /skills/catalog` = 23.
- [ ] 14. Build + lint do frontend; commit + push.
