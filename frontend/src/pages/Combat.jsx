import { useState, useCallback, useRef, useEffect } from 'react';
import { combatService } from '../services/api';
import './Combat.css';

// Tela de combate — Spec 2, Sub-parte A.
// Componente controlado: recebe o estado inicial da sessão (vindo de /combat/hunt)
// e conduz o loop chamando /action, /react, /flee. Ao terminar, chama onEnd com
// o status final para o Game recarregar o estado do personagem.
//
// Regras de UX fiéis ao design:
//  - O jogador escolhe Ataque Rápido ou Forte (curto alcance) no seu turno.
//  - Quando há reação pendente, um overlay pede Bloquear/Desviar/Deixar passar
//    SEM revelar o tipo do ataque inimigo (matchup às cegas).
//  - "Uma reação por ciclo": o backend controla; o overlay some após reagir.

const STATUS_LABEL = {
  allies_won:  'Vitória',
  enemies_won: 'Derrota',
  fled:        'Você fugiu',
};

export default function Combat({ initialState, onEnd }) {
  const [state, setState] = useState(initialState);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState(() => {
    const first = ['O combate começou.'];
    return initialState.events && initialState.events.length
      ? [...first, ...initialState.events] : first;
  });
  const logEndRef = useRef(null);

  const session = state.session;
  const participants = state.participants || [];
  const ally = participants.find((p) => p.side === 'ally');
  const enemies = participants.filter((p) => p.side === 'enemy');
  const status = session.status;
  const ended = status !== 'active';
  const awaitingReaction = !!(session.pending && session.pending.awaiting_reaction);

  const activeId = session.turn_order?.[session.active_index];
  const isPlayerTurn = !ended && !awaitingReaction && ally && activeId === ally.id && !ally.is_defeated;
  const reward = session.status !== 'active' ? state.reward : null;
  const abilityList = state.abilities || [];

  // Aplica um novo estado; o log narrativo vem PRONTO do servidor (events).
  const applyState = useCallback((next) => {
    setState(next);
    if (next.events && next.events.length) {
      setLog((prev) => [...prev, ...next.events].slice(-60));
    }
  }, []);

  // Auto-scroll do log para a última linha.
  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  async function doAction(action, type) {
    if (busy || !isPlayerTurn) return;
    setBusy(true);
    try {
      const target = enemies.find((e) => !e.is_defeated);
      const { data } = await combatService.action(session.id, action, target?.id, type);
      applyState(data);
    } catch (err) {
      setLog((prev) => [...prev, err.response?.data?.error || 'Erro na ação.']);
    } finally {
      setBusy(false);
    }
  }

  async function doReact(reaction) {
    if (busy || !awaitingReaction) return;
    setBusy(true);
    try {
      const { data } = await combatService.react(session.id, reaction);
      applyState(data);
    } catch (err) {
      setLog((prev) => [...prev, err.response?.data?.error || 'Erro na reação.']);
    } finally {
      setBusy(false);
    }
  }

  async function doAbility(slug) {
    if (busy || !isPlayerTurn) return;
    setBusy(true);
    try {
      const target = enemies.find((e) => !e.is_defeated);
      const { data } = await combatService.action(session.id, 'ability', target?.id, undefined, slug);
      applyState(data);
    } catch (err) {
      setLog((prev) => [...prev, err.response?.data?.error || 'Erro ao usar habilidade.']);
    } finally {
      setBusy(false);
    }
  }

  async function doFlee() {
    if (busy || ended) return;
    setBusy(true);
    try {
      const { data } = await combatService.flee(session.id);
      applyState(data);
    } catch (err) {
      setLog((prev) => [...prev, err.response?.data?.error || 'Erro ao fugir.']);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="combat-overlay">
      <div className="combat-arena">

        {/* Inimigos */}
        <div className="combat-side enemies">
          {enemies.map((e) => (
            <Combatant key={e.id} p={e} active={activeId === e.id && !ended} enemy />
          ))}
        </div>

        {/* Jogador */}
        <div className="combat-side ally">
          {ally && <Combatant p={ally} active={isPlayerTurn} />}
        </div>

        {/* Log */}
        <div className="combat-log">
          {log.map((line, i) => (
            <p key={i} className="combat-log-line">{line}</p>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* Painel de ação / reação / fim */}
        <div className="combat-actions">
          {ended ? (
            <div className="combat-end">
              <div className={`combat-end-title ${status === 'allies_won' ? 'text-gold' : 'text-danger'}`}>
                {STATUS_LABEL[status] || 'Fim do combate'}
              </div>
              {reward && reward.defeat && (
                <div className="combat-reward">
                  <div className="combat-reward-loot text-danger">
                    Você perdeu {reward.xpLost} XP e {reward.staminaLost} de estamina.
                  </div>
                  <div className="combat-reward-loot text-dim">
                    Você desperta em segurança, com metade da vida.
                  </div>
                </div>
              )}
              {reward && !reward.defeat && (
                <div className="combat-reward">
                  <div className="combat-reward-xp">+{reward.xpGained} XP</div>
                  {reward.leveledUp && (
                    <div className="combat-reward-level text-gold">
                      Nível {reward.newLevel}! {reward.levelUpSummary.join(' ')}
                    </div>
                  )}
                  {reward.loot && reward.loot.length > 0 && (
                    <div className="combat-reward-loot text-dim">
                      Espólio: {reward.loot.map((d) => `${d.quantity}× ${d.item_slug}`).join(', ')}
                    </div>
                  )}
                </div>
              )}
              <button className="btn-primary" onClick={() => onEnd(status)} disabled={busy}>
                Continuar
              </button>
            </div>
          ) : awaitingReaction ? (
            <div className="combat-reaction">
              <div className="combat-prompt text-gold">
                Um inimigo vai atacar. Reagir?
              </div>
              <div className="combat-btn-row">
                <button className="btn-action" onClick={() => doReact('block')} disabled={busy}>Bloquear</button>
                <button className="btn-action" onClick={() => doReact('dodge')} disabled={busy}>Desviar</button>
                <button className="btn-ghost small" onClick={() => doReact('pass')} disabled={busy}>Deixar passar</button>
              </div>
            </div>
          ) : isPlayerTurn ? (
            <div className="combat-turn">
              <div className="combat-prompt text-gold">Seu turno</div>
              <div className="combat-btn-row">
                <button className="btn-action" onClick={() => doAction('attack', 'quick')} disabled={busy}>
                  Ataque Rápido
                </button>
                <button className="btn-action" onClick={() => doAction('attack', 'strong')} disabled={busy}>
                  Ataque Forte
                </button>
                <button className="btn-ghost small" onClick={() => doAction('pass')} disabled={busy}>Passar</button>
                <button className="btn-ghost small" onClick={doFlee} disabled={busy}>Fugir</button>
              </div>
              {abilityList.length > 0 && (
                <div className="combat-abilities">
                  <div className="combat-abilities-label text-dim">Habilidades</div>
                  <div className="combat-btn-row">
                    {abilityList.map((ab) => {
                      const onCd = ab.cooldown_remaining > 0;
                      return (
                        <button
                          key={ab.slug}
                          className="btn-ability"
                          onClick={() => doAbility(ab.slug)}
                          disabled={busy || onCd}
                          title={ab.description || ''}
                        >
                          {ab.name}
                          {onCd && <span className="ability-cd"> ({ab.cooldown_remaining})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="combat-waiting text-dim">Os inimigos agem...</div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Combatente (cartão com HP) ──────────────────────────────────────
function Combatant({ p, active, enemy }) {
  const pct = p.hp_max ? Math.max(0, (p.hp_current / p.hp_max) * 100) : 0;
  return (
    <div className={`combatant ${enemy ? 'is-enemy' : 'is-ally'} ${p.is_defeated ? 'defeated' : ''} ${active ? 'active' : ''}`}>
      <div className="combatant-name">
        {p.display_name}
        <span className="text-dim"> · Nv {p.level}</span>
      </div>
      <div className="combatant-hpbar">
        <div className="combatant-hpfill" style={{ width: `${pct}%` }} />
      </div>
      <div className="combatant-hpnum text-dim">
        {p.is_defeated ? 'Derrotado' : `${p.hp_current}/${p.hp_max} PV`}
      </div>
    </div>
  );
}


