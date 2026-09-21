import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { characterService, skillService, combatService } from '../services/api';
import Combat from './Combat';
import './Game.css';

const INTRO_TEXT = `Você chegou a Ironfall antes do amanhecer.

A cidade acorda devagar. O cheiro de carvão mistura com névoa fria. As ruas de pedra ainda guardam o silêncio da madrugada, e as luzes das forjas já piscam lá no fundo do distrito industrial. Ironfall não é uma cidade bonita. É uma cidade que funciona — ou pelo menos tenta.

Ao norte, além dos muros e das colinas de cinza, você consegue ver. Não claramente. Mas consegue. Uma linha no horizonte que não é nuvem, não é fumaça, não é névoa comum. É a Névoa. Sempre esteve lá. Todo mundo diz que não vale a pena olhar para ela.

Todo mundo.

Você está no Distrito Central de Ironfall. Há pessoas aqui — algumas dispostas a conversar, outras com coisas a oferecer, algumas com histórias que não terminaram. O mapa ao seu redor é seu para descobrir. Nenhum marcador vai guiar você. Nenhuma seta vai apontar o caminho.

O que está além da névoa é sua decisão descobrir.`;

const CLASS_LABELS = {
  vagante_nevoas:  'Vagante das Névoas',
  arauto_conclave: 'Arauto do Conclave',
  exilado_ferro:   'Exilado de Ferro',
  confessor_veu:   'Confessor do Véu',
  cronista_ruinas: 'Cronista das Ruínas'
};

const EQUIPMENT_SLOTS = [
  { key: 'head',      label: 'Cabeça'          },
  { key: 'chest',     label: 'Tórax'           },
  { key: 'hands',     label: 'Mãos'            },
  { key: 'legs',      label: 'Pernas'          },
  { key: 'main_hand', label: 'Arma Principal'  },
  { key: 'off_hand',  label: 'Arma Secundária' },
  { key: 'accessory', label: 'Acessório'       },
];

const GRADE = [
  '','F-','F','F+','E-','E','E+',
  'D-','D','D+','C-','C','C+',
  'B-','B','B+','A-','A','A+','S-','S','S+'
];

function grade(val) { return GRADE[val] || val || '—'; }

// Modificador Grande (letra) de um atributo (1..21) -> 1..7.
function mgOf(value) { return Math.max(1, Math.ceil(value / 3)); }

const SKILL_ATTR_ABBR = {
  strength: 'FOR', agility: 'AGI', resistance: 'RES',
  intellect: 'INT', perception: 'PER', sanity: 'SAN'
};

function skillReqMet(skill, attrs) {
  const req = skill.attr_mg_req || 0;
  if (req <= 0) return true;
  const a = mgOf(attrs[skill.base_attr] ?? 0);
  const b = skill.base_attr_alt ? mgOf(attrs[skill.base_attr_alt] ?? 0) : 0;
  return Math.max(a, b) >= req;
}

// ─── Introdução ──────────────────────────────────────────────────────
function IntroScreen({ characterName, onContinue }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`intro-screen ${visible ? 'visible' : ''}`}>
      <div className="intro-content">
        <p className="intro-name text-gold">{characterName}</p>
        <div className="intro-text font-narrative">
          {INTRO_TEXT.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <button className="btn-primary intro-btn" onClick={onContinue}>
          Entrar no mundo
        </button>
      </div>
    </div>
  );
}

// ─── Painel esquerdo ─────────────────────────────────────────────────
function PanelLeft({ character, currentPage, onNavigate, onLogout }) {
  const derived = character?.character_derived || {};

  const hpPct      = derived.hp_max      ? (derived.hp_current      / derived.hp_max)      * 100 : 0;
  const staminaPct = derived.stamina_max ? (derived.stamina_current / derived.stamina_max) * 100 : 0;
  const xpPct      = character?.xp_to_next ? (character.xp / character.xp_to_next) * 100 : 0;

  const navButtons = [
    { id: 'world',     label: 'Mundo'      },
    { id: 'character', label: 'Personagem' },
    { id: 'inventory', label: 'Inventário' },
    { id: 'quests',    label: 'Missões'    },
    { id: 'documents', label: 'Documentos' },
    { id: 'skills',    label: 'Perícias'   },
  ];

  return (
    <div className="panel panel-left">
      <div className="panel-section">
        <div className="char-name text-gold">{character?.name}</div>
        <div className="char-meta text-dim">
          {CLASS_LABELS[character?.class] || character?.class} · Nível {character?.level}
        </div>
      </div>

      <div className="panel-section">
        <div className="status-row">
          <span className="status-label text-dim">PV</span>
          <div className="status-bar">
            <div className="status-fill hp" style={{ width: `${hpPct}%` }} />
          </div>
          <span className="status-numbers text-dim">
            {derived.hp_current ?? '—'}/{derived.hp_max ?? '—'}
          </span>
        </div>
        <div className="status-row">
          <span className="status-label text-dim">STM</span>
          <div className="status-bar">
            <div className="status-fill stamina" style={{ width: `${staminaPct}%` }} />
          </div>
          <span className="status-numbers text-dim">
            {derived.stamina_current ?? '—'}/{derived.stamina_max ?? '—'}
          </span>
        </div>
        <div className="status-row">
          <span className="status-label text-dim">XP</span>
          <div className="status-bar">
            <div className="status-fill xp" style={{ width: `${xpPct}%` }} />
          </div>
          <span className="status-numbers text-dim">
            {character?.xp ?? 0}/{character?.xp_to_next ?? 100}
          </span>
        </div>
      </div>

      <div className="panel-section nav-section">
        {navButtons.map(btn => (
          <button
            key={btn.id}
            className={`nav-btn ${currentPage === btn.id ? 'active' : ''}`}
            onClick={() => onNavigate(btn.id)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="panel-footer">
        <button className="btn-ghost small" onClick={onLogout}>
          Sair da conta
        </button>
      </div>
    </div>
  );
}

// ─── Página: Mundo ───────────────────────────────────────────────────
function PageWorld({ node, clock, narrationSeed }) {
  const phaseLabel = clock?.currentPhase === 'morning' ? 'Dia' : 'Noite';
  const minutes    = clock?.secondsUntilNextPhase
    ? Math.ceil(clock.secondsUntilNextPhase / 60) : null;

  const weather     = clock?.current_weather || 'clear';
  const weatherLabel = {
    clear:      '',
    rain:       '· Chuva',
    heavy_rain: '· Chuva forte',
    fog:        '· Névoa baixa',
    storm:      '· Tempestade',
    snow:       '· Neve',
  }[weather] || '';

  const narration = getNodeNarration(
    node?.description_key,
    clock?.currentPhase,
    weather,
    narrationSeed
  );

  return (
    <div className="page-content">
      <div className="world-header">
        <div className="world-location text-gold">{node?.name}</div>
        <div className="world-clock text-dim">
          {phaseLabel}
          {minutes !== null &&
            ` · ${minutes}min até ${clock.currentPhase === 'morning' ? 'noite' : 'amanhecer'}`}
          {weatherLabel && ` ${weatherLabel}`}
        </div>
      </div>
      <div className="narration-box font-narrative">
        <p>{narration}</p>
      </div>
    </div>
  );
}

// ─── Página: Personagem ──────────────────────────────────────────────
const ATTR_ORDER = [
  { key: 'strength',   abbr: 'FOR', label: 'Força'       },
  { key: 'agility',    abbr: 'AGI', label: 'Agilidade'   },
  { key: 'resistance', abbr: 'RES', label: 'Resistência' },
  { key: 'intellect',  abbr: 'INT', label: 'Intelecto'   },
  { key: 'perception', abbr: 'PER', label: 'Percepção'   },
  { key: 'sanity',     abbr: 'SAN', label: 'Sanidade'    },
];

function PageCharacter({ character, inventory, onAllocateAttributes }) {
  const attrs   = character?.character_attributes || {};
  const derived = character?.character_derived    || {};

  const available = attrs.points_available ?? 0;

  // Distribuição pendente de atributos (deltas por chave), ainda não confirmada.
  const [pending, setPending] = useState({});
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const spent = Object.values(pending).reduce((a, b) => a + b, 0);
  const left  = available - spent;
  const hasPending = spent > 0;

  function adjustAttr(key, delta) {
    const cur = pending[key] || 0;
    const next = cur + delta;
    if (next < 0) return;
    if (delta > 0 && left === 0) return;
    const resulting = (attrs[key] || 0) + next;
    if (delta > 0 && resulting > 21) return;
    setPending((prev) => ({ ...prev, [key]: next }));
  }

  async function confirmAttrs() {
    if (!hasPending) return;
    setSaving(true);
    setError('');
    try {
      await onAllocateAttributes(pending);
      setPending({});
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao distribuir atributos.');
    } finally {
      setSaving(false);
    }
  }

  const equipped = {};
  (inventory || []).forEach(inv => {
    if (inv.is_equipped && inv.equipped_slot) {
      equipped[inv.equipped_slot] = inv;
    }
  });

  const derivedAttrs = [
    { label: 'Pontos de Vida',   val: `${derived.hp_current ?? '—'}/${derived.hp_max ?? '—'}` },
    { label: 'Estamina',         val: `${derived.stamina_current ?? '—'}/${derived.stamina_max ?? '—'}` },
    { label: 'Ataque C.C.',      val: derived.attack_melee      ?? '—' },
    { label: 'Ataque Distância', val: derived.attack_ranged     ?? '—' },
    { label: 'Defesa',           val: derived.defense           ?? '—' },
    { label: 'Evasão',           val: derived.evasion           ?? '—' },
    { label: 'Velocidade',       val: derived.speed             ?? '—' },
    { label: 'Acerto',           val: derived.accuracy          ?? '—' },
    { label: 'Crítico',          val: derived.crit_chance ? `${derived.crit_chance}%` : '—' },
    { label: 'Dano Crítico',     val: derived.crit_damage ? `${derived.crit_damage}×` : '—' },
    { label: 'Observação',       val: derived.observation       ?? '—' },
    { label: 'R. Mental',        val: derived.mental_resistance ?? '—' },
    { label: 'R. Névoa',         val: derived.mist_resistance   ?? '—' },
    { label: 'Carga máx.',       val: derived.carry_capacity ? `${derived.carry_capacity}kg` : '—' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-title text-gold">{character?.name}</h2>
        <p className="page-subtitle text-dim">
          {CLASS_LABELS[character?.class]} · Nível {character?.level}
        </p>
      </div>

      <div className="char-page-section">
        <div className="section-label text-dim">Progressão</div>
        <div className="xp-info">
          <span>{character?.xp ?? 0} / {character?.xp_to_next ?? 100} XP</span>
          {attrs.points_available > 0 && (
            <span className="points-alert text-gold">
              · {attrs.points_available} ponto{attrs.points_available > 1 ? 's' : ''} disponível{attrs.points_available > 1 ? 'is' : ''}
            </span>
          )}
        </div>
        <div className="status-bar" style={{ marginTop: 6 }}>
          <div className="status-fill xp"
            style={{ width: `${(character?.xp / character?.xp_to_next) * 100}%` }} />
        </div>
      </div>

      <div className="char-page-section">
        <div className="section-label text-dim">Equipamentos</div>
        <div className="equipment-slots">
          {EQUIPMENT_SLOTS.map(slot => {
            const item = equipped[slot.key];
            return (
              <div key={slot.key} className={`equip-slot ${item ? 'filled' : 'empty'}`}>
                <span className="equip-slot-label text-dim">{slot.label}</span>
                <span className="equip-slot-item">
                  {item ? item.items?.name || 'Item' : <span className="text-dim">—</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="char-page-section">
        <div className="section-label text-dim">
          Atributos Base
          {available > 0 && (
            <span className="points-alert text-gold">
              {' '}· {left} ponto{left !== 1 ? 's' : ''} a distribuir
            </span>
          )}
        </div>
        <div className="attr-table">
          {ATTR_ORDER.map(a => {
            const base = attrs[a.key] ?? 0;
            const add  = pending[a.key] || 0;
            const val  = base + add;
            const canAdd = available > 0 && left > 0 && val < 21;
            return (
              <div key={a.abbr} className="attr-table-row">
                <span className="attr-table-abbr text-dim">{a.abbr}</span>
                <span className="attr-table-label">{a.label}</span>
                <span className="attr-table-grade text-gold">{grade(val)}</span>
                <span className="attr-table-num text-dim">({val})</span>
                {available > 0 && (
                  <span className="attr-control" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                    <button className="attr-btn" onClick={() => adjustAttr(a.key, -1)} disabled={add === 0}>−</button>
                    <button className="attr-btn" onClick={() => adjustAttr(a.key, 1)} disabled={!canAdd}>+</button>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="login-error">{error}</p>}

        {hasPending && (
          <div className="create-actions" style={{ marginTop: 12 }}>
            <button className="btn-ghost" onClick={() => setPending({})} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={confirmAttrs} disabled={saving}>
              {saving ? 'Salvando...' : 'Confirmar atributos'}
            </button>
          </div>
        )}
      </div>

      <div className="char-page-section">
        <div className="section-label text-dim">Atributos Derivados</div>
        <div className="derived-table">
          {derivedAttrs.map(a => (
            <div key={a.label} className="derived-table-row">
              <span className="derived-label text-dim">{a.label}</span>
              <span className="derived-val">{a.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Página: Inventário ──────────────────────────────────────────────
function PageInventory({ inventory, derived }) {
  const items    = inventory || [];
  const equipped = items.filter(i => i.is_equipped);
  const backpack = items.filter(i => !i.is_equipped);

  const totalWeight = items.reduce((sum, i) => sum + ((i.items?.weight || 0) * (i.quantity || 1)), 0);
  const maxWeight   = derived?.carry_capacity || 0;
  const weightPct   = maxWeight ? Math.min((totalWeight / maxWeight) * 100, 100) : 0;
  const weightOver  = totalWeight > maxWeight;

  const RARITY_COLORS = {
    common:   'var(--color-text-dim)',
    uncommon: '#48bb78',
    rare:     '#63b3ed',
    unique:   'var(--color-gold)',
  };

  function ItemRow({ inv }) {
    const item = inv.items || {};
    return (
      <div className="inventory-item">
        <div className="inv-item-info">
          <span className="inv-item-name"
            style={{ color: RARITY_COLORS[item.rarity] || 'inherit' }}>
            {item.name || 'Item desconhecido'}
          </span>
          {inv.quantity > 1 && (
            <span className="inv-item-qty text-dim">×{inv.quantity}</span>
          )}
          {inv.durability !== null && inv.durability !== undefined && (
            <span className="inv-item-dur text-dim">Dur. {inv.durability}</span>
          )}
        </div>
        <span className="inv-item-weight text-dim">
          {((item.weight || 0) * (inv.quantity || 1)).toFixed(1)}kg
        </span>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-title text-gold">Inventário</h2>
        <div className="weight-row">
          <span className={`weight-info ${weightOver ? 'text-danger' : 'text-dim'}`}>
            {totalWeight.toFixed(1)}kg / {maxWeight}kg
          </span>
          <div className="status-bar" style={{ flex: 1, marginLeft: 12 }}>
            <div className="status-fill"
              style={{
                width: `${weightPct}%`,
                background: weightOver ? '#c53030' : '#c9a84c'
              }} />
          </div>
        </div>
      </div>

      {equipped.length > 0 && (
        <div className="char-page-section">
          <div className="section-label text-dim">Equipado</div>
          {equipped.map(inv => <ItemRow key={inv.id} inv={inv} />)}
        </div>
      )}

      <div className="char-page-section">
        <div className="section-label text-dim">
          Mochila {backpack.length === 0 &&
            <span className="text-dim font-narrative"> — vazia</span>}
        </div>
        {backpack.length > 0
          ? backpack.map(inv => <ItemRow key={inv.id} inv={inv} />)
          : <p className="text-dim font-narrative"
               style={{ fontSize: 14, fontStyle: 'italic' }}>
              Nada além do que você carrega consigo.
            </p>
        }
      </div>
    </div>
  );
}

// ─── Página: Perícias ────────────────────────────────────────────────
function PageSkills({ character, catalog, onAllocated }) {
  const attrs   = character?.character_attributes || {};
  const owned   = character?.character_skills || [];
  const levelBySlug = {};
  owned.forEach(s => { levelBySlug[s.skill_name] = s.level; });

  const fieldAvail  = attrs.field_skill_points  ?? 0;
  const combatAvail = attrs.combat_skill_points ?? 0;

  // Alocação pendente (ainda não confirmada): { field:{slug:pts}, combat:{slug:pts} }
  const [pending, setPending] = useState({ field: {}, combat: {} });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const fieldSpent  = Object.values(pending.field).reduce((a, b) => a + b, 0);
  const combatSpent = Object.values(pending.combat).reduce((a, b) => a + b, 0);
  const fieldLeft   = fieldAvail  - fieldSpent;
  const combatLeft  = combatAvail - combatSpent;
  const hasPending  = fieldSpent > 0 || combatSpent > 0;

  function adjust(type, slug, delta) {
    const cur = pending[type][slug] || 0;
    const next = cur + delta;
    if (next < 0) return;
    const left = type === 'field' ? fieldLeft : combatLeft;
    if (delta > 0 && left === 0) return;
    const currentLevel = (levelBySlug[slug] || 0) + cur;
    if (delta > 0 && currentLevel >= 10) return;
    setPending(prev => ({ ...prev, [type]: { ...prev[type], [slug]: next } }));
  }

  async function confirm() {
    if (!hasPending) return;
    setSaving(true);
    setError('');
    try {
      await onAllocated(pending);
      setPending({ field: {}, combat: {} });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao distribuir perícias.');
    } finally {
      setSaving(false);
    }
  }

  function SkillRow({ skill, type }) {
    const base = levelBySlug[skill.slug] || 0;
    const add  = pending[type][skill.slug] || 0;
    const level = base + add;
    const met = skillReqMet(skill, attrs);
    const left = type === 'field' ? fieldLeft : combatLeft;
    return (
      <div className="derived-table-row" style={!met ? { opacity: 0.5 } : undefined} title={skill.description || ''}>
        <span className="derived-label">
          {skill.name}
          <span className="text-dim">
            {' · '}{SKILL_ATTR_ABBR[skill.base_attr]}
            {skill.base_attr_alt ? `/${SKILL_ATTR_ABBR[skill.base_attr_alt]}` : ''}
            {skill.attr_mg_req > 0 ? ` · req ${SKILL_ATTR_ABBR[skill.base_attr]} ${'FEDCBAS'[skill.attr_mg_req - 1]}` : ''}
          </span>
        </span>
        <span className="attr-control" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="attr-btn" onClick={() => adjust(type, skill.slug, -1)} disabled={add === 0}>−</button>
          <span className="derived-val" style={add > 0 ? { color: 'var(--color-gold)' } : undefined}>{level}</span>
          <button className="attr-btn" onClick={() => adjust(type, skill.slug, 1)} disabled={!met || left === 0 || level >= 10}>+</button>
        </span>
      </div>
    );
  }

  const fieldSkills  = (catalog || []).filter(s => s.skill_type === 'field');
  const combatSkills = (catalog || []).filter(s => s.skill_type === 'combat');

  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-title text-gold">Perícias</h2>
        <p className="page-subtitle text-dim">
          Combate: {combatLeft} · Campo: {fieldLeft} ponto(s) a distribuir
        </p>
      </div>

      {(catalog || []).length === 0 && (
        <p className="text-dim font-narrative">Catálogo de perícias indisponível.</p>
      )}

      <div className="char-page-section">
        <div className="section-label text-dim">Combate</div>
        <div className="derived-table">
          {combatSkills.map(s => <SkillRow key={s.slug} skill={s} type="combat" />)}
        </div>
      </div>

      <div className="char-page-section">
        <div className="section-label text-dim">Campo</div>
        <div className="derived-table">
          {fieldSkills.map(s => <SkillRow key={s.slug} skill={s} type="field" />)}
        </div>
      </div>

      {error && <p className="login-error">{error}</p>}

      {hasPending && (
        <div className="create-actions" style={{ marginTop: 16 }}>
          <button className="btn-ghost" onClick={() => setPending({ field: {}, combat: {} })} disabled={saving}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={confirm} disabled={saving}>
            {saving ? 'Salvando...' : 'Confirmar distribuição'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Página: Em construção ───────────────────────────────────────────
function PageUnderConstruction({ label }) {
  return (
    <div className="page-content under-construction">
      <p className="text-dim font-narrative">{label} — em construção.</p>
    </div>
  );
}

// ─── Painel direito ──────────────────────────────────────────────────
// onMove vem do componente principal onde character e setGameState existem
function PanelRight({ node, connections, npcs, activeQuests, onlinePlayers, onMove, onHunt, hunting, onSave, saving }) {
  const [activeTab, setActiveTab] = useState('world');

  const safeNpcs          = npcs          || [];
  const safeConnections   = connections   || [];
  const safeActiveQuests  = activeQuests  || [];
  const safeOnlinePlayers = onlinePlayers || [];

  return (
    <div className="panel panel-right">

      <div className="interaction-tabs">
        <button
          className={`itab ${activeTab === 'world' ? 'active' : ''}`}
          onClick={() => setActiveTab('world')}
        >
          Mundo
        </button>
        <button
          className={`itab ${activeTab === 'online' ? 'active' : ''}`}
          onClick={() => setActiveTab('online')}
        >
          Online
          {safeOnlinePlayers.length > 0 && (
            <span className="badge">{safeOnlinePlayers.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'world' && (
        <>
          {safeNpcs.length > 0 && (
            <div className="interaction-section">
              <div className="section-label text-dim">Pessoas aqui</div>
              {safeNpcs.map(npc => (
                <div key={npc.id} className="npc-item">
                  <div className="npc-name">
                    {npc.name}
                    {npc.is_quest_giver && <span className="quest-dot" />}
                  </div>
                  {npc.description && (
                    <div className="npc-desc text-dim font-narrative">
                      {npc.description}
                    </div>
                  )}
                  <button className="btn-action">Falar</button>
                </div>
              ))}
            </div>
          )}

          {safeConnections.length > 0 && (
            <div className="interaction-section">
              <div className="section-label text-dim">Saídas</div>
              {safeConnections.map(conn => (
                <div key={conn.id} className="exit-item">
                  <div className="exit-info">
                    <span className="exit-label">{conn.direction_label}</span>
                    {conn.world_nodes?.is_safe_zone && (
                      <span className="exit-safe text-dim">Zona segura</span>
                    )}
                  </div>
                  <span className="exit-cost text-dim">{conn.travel_cost} STM</span>
                  <button
                    className="btn-action"
                    onClick={() => onMove(conn.to_node_id)}
                  >
                    Ir →
                  </button>
                </div>
              ))}
            </div>
          )}

          {node?.node_type === 'settlement' && (
            <div className="interaction-section">
              <div className="section-label text-dim">Assentamento</div>
              <button className="btn-field" onClick={onSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar progresso aqui'}
              </button>
            </div>
          )}

          {!node?.is_safe_zone && (
            <div className="interaction-section">
              <div className="section-label text-dim">Ações de campo</div>
              <button className="btn-field" disabled title="Em breve">Explorar área</button>
              <button className="btn-field" onClick={onHunt} disabled={hunting}>
                {hunting ? 'Procurando...' : 'Caçar'}
              </button>
              <button className="btn-field" disabled title="Em breve">Coletar recursos</button>
            </div>
          )}

          {safeActiveQuests.length > 0 && (
            <div className="interaction-section">
              <div className="section-label text-dim">Missões ativas</div>
              {safeActiveQuests.map((cq, i) => (
                <div key={i} className="quest-compact">
                  <span className="text-gold">{cq.quests?.title}</span>
                  <span className="text-dim"> · Etapa {cq.current_step}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'online' && (
        <div className="interaction-section">
          <div className="section-label text-dim">
            {safeOnlinePlayers.length === 0
              ? 'Ninguém mais aqui'
              : `${safeOnlinePlayers.length} jogador${safeOnlinePlayers.length > 1 ? 'es' : ''} neste local`
            }
          </div>
          {safeOnlinePlayers.length === 0 ? (
            <p className="text-dim font-narrative"
               style={{ fontSize: 13, fontStyle: 'italic', marginTop: 8 }}>
              Você está sozinho aqui por enquanto.
            </p>
          ) : (
            safeOnlinePlayers.map(p => (
              <div key={p.character_id} className="online-player">
                <span className="online-name">{p.name}</span>
                <span className="online-meta text-dim">
                  Nv.{p.level} · {CLASS_LABELS[p.class] || p.class}
                </span>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}

// ─── Sistema de narração dinâmica ───────────────────────────────────

// Descrições base — múltiplas variações por local
// Uma delas é sorteada a cada entrada no local
const NODE_DESCRIPTIONS = {
  ironfall_central: [
    'Uma cidade que cheira a ferro e fumaça de carvão. As ruas de pedra cinza estão sempre movimentadas — comerciantes, guardas, trabalhadores das forjas. Ironfall não é bonita. É funcional, e sabe disso.',
    'O barulho de Ironfall nunca para completamente. Mesmo nos momentos mais calmos, há sempre o som distante de uma bigorna, de passos sobre pedra, de alguém negociando algo que provavelmente não deveria. A cidade respira metal.',
    'Ironfall foi construída para durar, não para impressionar. Cada pedra foi colocada com propósito. Os mais velhos dizem que havia uma praça central antes — foi desmontada para construir mais forjas. Ninguém reclamou muito.',
  ],
  ironfall_gate: [
    'O Portão da Encosta é o único ponto onde Ironfall admite que tem um limite. Os guardas aqui parecem diferentes dos da cidade — mais quietos, com olhos que ficam no horizonte mais do que nas pessoas que passam.',
    'Entre a cidade e o que vem depois, o portão. A madeira reforçada com ferro tem marcas que podem ser arranhões de animais grandes, ou ferramentas mal manuseadas. Ninguém pergunta.',
    'Há uma placa velha no portal que diz algo que o tempo tornou ilegível. Alguém tentou cobri-la com uma nova, mas a nova caiu. O que ficou da original parece começar com uma letra que pode ser um V, ou um Y.',
  ],
  cinzas_forest: [
    'A Floresta das Cinzas não tem esse nome por acidente. As árvores são de um cinza desbotado que não parece doença nem morte — parece esquecimento. O chão absorve o som dos passos de um jeito que incomoda mais do que deveria.',
    'Há trilhas aqui que não estão em nenhum mapa de Ironfall. Algumas parecem antigas. Uma delas, a nordeste, tem pedras dispostas de um jeito que pode ser natural, ou pode ter sido alguém que queria marcar algo sem chamar atenção.',
    'Os caçadores de Ironfall evitam a Floresta das Cinzas depois do meio-dia. Quando perguntados por quê, a maioria muda de assunto. Um velho disse uma vez que "o que vive aqui aprendeu a esperar" — e não explicou mais.',
  ],
  burnt_tower: [
    'Três paredes e parte do teto. O fogo que passou aqui foi intenso e deliberado — as marcas na pedra mostram que o centro queimou por mais tempo do que as bordas. Alguém queria ter certeza.',
    'Os escombros foram vasculhados antes. Há objetos deslocados, pilhas organizadas de destroços que não fazem sentido numa ruína abandonada. Alguém esteve aqui procurando algo — ou escondendo.',
    'Da janela que ainda existe, dá para ver a linha da floresta a leste. E entre as árvores, nas noites com pouca névoa, moradores de Ironfall juram que já viram uma luz que não era da lua. Ninguém foi verificar.',
  ],
  bell_cave: [
    'A entrada é mais estreita do que parece de longe. Por dentro, o teto sobe abruptamente e o espaço se abre. O silêncio aqui é diferente — não é ausência de som, é uma presença de algo que contém o som.',
    'As paredes da gruta têm marcas. Algumas são claramente naturais — erosão, minerais. Outras têm uma regularidade que a natureza raramente produz. Estão baixas demais para serem acidentais e altas demais para serem de uma criança.',
    'Há um cheiro aqui que não é terra, não é pedra, não é animal. É algo metálico mas orgânico ao mesmo tempo. Quem conhece fundições diz que lembra cobre aquecido. Quem não conhece apenas sabe que não gosta.',
  ],
};

// Sufixos de hora
const HOUR_SUFFIXES = {
  morning: [
    ' A luz da manhã chega filtrada e fria.',
    ' O amanhecer traz um silêncio que dura pouco.',
    ' Ainda cedo — o dia não decidiu o que vai ser.',
  ],
  night: [
    ' A noite fecha os espaços e abre outras possibilidades.',
    ' Escuro o suficiente para que coisas aconteçam sem testemunhas.',
    ' À noite, tudo aqui parece um grau mais perigoso do que durante o dia.',
  ],
};

// Sufixos de clima — substitui ou complementa o sufixo de hora
const WEATHER_SUFFIXES = {
  clear:      null, // sem sufixo extra, usa só o de hora
  rain:       ' A chuva cobre os sons e borra os detalhes.',
  heavy_rain: ' A chuva forte dificulta ver além de alguns metros.',
  fog:        ' A névoa baixa reduz a visibilidade e traz um frio úmido.',
  storm:      ' A tempestade faz o ambiente vibrar com trovões distantes.',
  snow:       ' A neve abafa os sons e deixa rastros de quem passou.',
};

// Função principal de narração
function getNodeNarration(key, phase, weather, seed) {
  const descriptions = NODE_DESCRIPTIONS[key];
  if (!descriptions) return 'Você observa o ambiente ao redor.';

  // Usa o seed para sortear a descrição — mesmo seed = mesma descrição
  // Isso garante que a descrição não mude enquanto o jogador está no local
  const index       = seed % descriptions.length;
  const description = descriptions[index];

  // Sufixo de clima sobrepõe hora se existir
  const weatherSuffix = weather ? WEATHER_SUFFIXES[weather] : null;
  const hourOptions   = HOUR_SUFFIXES[phase] || HOUR_SUFFIXES.morning;
  const hourSuffix    = hourOptions[seed % hourOptions.length];

  const suffix = weatherSuffix !== null && weatherSuffix !== undefined
    ? weatherSuffix
    : hourSuffix;

  return description + suffix;
}

// ─── Componente principal ────────────────────────────────────────────
export default function Game() {
  const navigate              = useNavigate();
  const { character, logout } = useGame();
  const [gameState, setGameState]     = useState(null);
  const [showIntro, setShowIntro]     = useState(false);
  const [currentPage, setCurrentPage] = useState('world');
  const [loading, setLoading]         = useState(true);
  const [moving, setMoving]           = useState(false);
  const [narrationSeed, setNarrationSeed] = useState(() => Math.floor(Math.random() * 1000));
  const [skillCatalog, setSkillCatalog]   = useState([]);
  const [combatState, setCombatState]     = useState(null); // estado da sessão de combate ativa
  const [hunting, setHunting]             = useState(false);
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await skillService.getCatalog();
        if (!cancelled) setSkillCatalog(data || []);
      } catch (err) {
        console.error('Erro ao carregar catálogo de perícias:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadGameState = useCallback(async () => {
    try {
      const { data } = await characterService.enter(character.id);
      setGameState(data);
      setShowIntro(data.isFirstLogin);
    } catch (err) {
      console.error('Erro ao entrar no jogo:', err);
      navigate('/characters');
    } finally {
      setLoading(false);
    }
  }, [character, navigate]);

  useEffect(() => {
    if (!character) {
      navigate('/characters');
      return;
    }
    // Data-fetching assíncrono: o setState ocorre após o await dentro de
    // loadGameState, não sincronamente neste effect. A regra experimental de
    // immutability não distingue esse caso; suprimida pontualmente aqui.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadGameState();
  }, [character, navigate, loadGameState]);

  useEffect(() => {
    if (!character || !gameState) return;
    const interval = setInterval(() => {
      characterService.heartbeat(character.id).catch(() => {});
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [character, gameState]);

  useEffect(() => {
    if (!character) return;
    function handleUnload() {
      characterService.goOffline(character.id).catch(() => {});
    }
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [character]);

  // handleMove fica aqui — tem acesso a character, setGameState e setCurrentPage
  async function handleMove(toNodeId) {
    if (moving) return;
    setMoving(true);
    try {
      const { data: moveResult } = await characterService.move(character.id, toNodeId);
      const { data } = await characterService.enter(character.id);
      setGameState(data);
      setCurrentPage('world');
	  setNarrationSeed(Math.floor(Math.random() * 1000));
      // Encontro ao mover (se a flag ENCOUNTERS_ON_MOVE estiver ligada no backend).
      if (moveResult?.encounter) {
        try {
          const { data: combat } = await combatService.hunt(character.id);
          setCombatState(combat);
        } catch { /* sem presa/spawn: segue sem combate */ }
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Erro ao se mover.';
      alert(message);
    } finally {
      setMoving(false);
    }
  }

  // Distribui pontos de perícia e recarrega o estado do jogo.
  async function handleAllocateSkills(alloc) {
    await characterService.allocateSkills(character.id, alloc);
    await loadGameState();
  }

  // Distribui pontos de atributo e recarrega o estado do jogo.
  async function handleAllocateAttributes(deltas) {
    await characterService.allocateAttributes(character.id, deltas);
    await loadGameState();
  }

  // Caçar: inicia um combate no nó atual e abre a tela de combate.
  async function handleHunt() {
    if (hunting || combatState) return;
    setHunting(true);
    try {
      const { data } = await combatService.hunt(character.id);
      setCombatState(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Não há presas para caçar aqui.');
    } finally {
      setHunting(false);
    }
  }

  // Fim do combate: fecha a tela e recarrega o estado do personagem (HP, XP, etc.).
  // Em caso de derrota, o backend já reposicionou o personagem no ponto de respawn;
  // recarregar o estado traz o nó novo.
  async function handleCombatEnd() {
    setCombatState(null);
    await loadGameState();
    setCurrentPage('world');
  }

  // Salva o nó atual (assentamento) como ponto de respawn.
  async function handleSavePoint() {
    if (saving) return;
    setSaving(true);
    try {
      const { data } = await characterService.savePoint(character.id);
      alert(`Progresso salvo em ${data.savedNode}.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Não foi possível salvar aqui.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    if (character) {
      characterService.goOffline(character.id).catch(() => {});
    }
    logout();
    navigate('/login');
  }

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '100vh', color: '#c9a84c'
    }}>
      Carregando...
    </div>
  );

  if (showIntro) return (
    <IntroScreen
      characterName={gameState.character.name}
      onContinue={() => setShowIntro(false)}
    />
  );

  const char    = gameState.character;
  const derived = char?.character_derived || {};

  function renderCenterPage() {
    switch (currentPage) {
      case 'world':
	    return <PageWorld
           node={gameState.node}
		   clock={gameState.clock}
		   narrationSeed={narrationSeed}
		/>;
      case 'character':
        return <PageCharacter
          character={char}
          inventory={gameState.inventory || []}
          onAllocateAttributes={handleAllocateAttributes}
        />;
      case 'inventory':
        return <PageInventory inventory={gameState.inventory || []} derived={derived} />;
      case 'quests':
        return <PageUnderConstruction label="Missões" />;
      case 'documents':
        return <PageUnderConstruction label="Documentos" />;
      case 'skills':
        return <PageSkills
          character={char}
          catalog={skillCatalog}
          onAllocated={handleAllocateSkills}
        />;
      default:
        return <PageWorld node={gameState.node} clock={gameState.clock} />;
    }
  }

  return (
    <div className="game-layout">
      <PanelLeft
        character={char}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />
      <div className="panel panel-center">
        {moving && (
          <div className="moving-overlay">
            <span className="text-dim font-narrative">Viajando...</span>
          </div>
        )}
        {renderCenterPage()}
      </div>
      <PanelRight
        node={gameState.node}
        connections={gameState.connections}
        npcs={gameState.npcs}
        activeQuests={gameState.activeQuests}
        onlinePlayers={gameState.onlinePlayers || []}
        onMove={handleMove}
        onHunt={handleHunt}
        hunting={hunting}
        onSave={handleSavePoint}
        saving={saving}
      />

      {combatState && (
        <Combat
          initialState={combatState}
          onEnd={handleCombatEnd}
        />
      )}
    </div>
  );
}