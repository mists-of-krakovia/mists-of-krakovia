import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { characterService, skillService } from '../services/api';
import './Characters.css';

const CLASS_INFO = {
  vagante_nevoas: {
    label: 'Vagante das Névoas',
    subtitle: 'Explorador e sobrevivente',
    description: 'Vive às margens do mundo conhecido. Lê o ambiente melhor do que qualquer outro e desaparece antes de ser encontrado.',
    skills: 'Armas Brancas Leves · Armas de Fogo Leves · Armaduras Leves'
  },
  arauto_conclave: {
    label: 'Arauto do Conclave',
    subtitle: 'Técnico e estrategista',
    description: 'Carrega o conhecimento de uma organização que talvez não exista mais. Resolve problemas com dispositivos e informação.',
    skills: 'Dispositivos de Combate · Armaduras Leves · Medicina de Combate'
  },
  exilado_ferro: {
    label: 'Exilado de Ferro',
    subtitle: 'Combatente resistente',
    description: 'Forjado em conflito. Absorve punição que quebraria qualquer outro e continua em pé.',
    skills: 'Armas Brancas Pesadas · Armaduras Pesadas · Escudos e Bloqueio'
  },
  confessor_veu: {
    label: 'Confessor do Véu',
    subtitle: 'Curandeiro e observador',
    description: 'Entende a névoa de um ângulo que outros recusam a considerar. Mantém aliados vivos quando tudo mais falha.',
    skills: 'Medicina de Combate · Armaduras Leves · Armas Brancas Leves'
  },
  cronista_ruinas: {
    label: 'Cronista das Ruínas',
    subtitle: 'Investigador e atirador',
    description: 'Documenta o que encontra. Luta à distância e resolve com o intelecto o que os outros tentam resolver com força.',
    skills: 'Armas de Fogo Leves · Armaduras Leves · Combate Desarmado'
  }
};

// Os 6 atributos base — descrições fiéis ao Volume III (Sistema de Personagem).
const ATTR_LABELS = {
  strength:   { label: 'Força',       abbr: 'FOR', desc: 'Potência física bruta. Determina o dano em combate corpo a corpo, a capacidade de carga e a força para usar armas e armaduras pesadas. Também resiste a empurrão e derrubada.' },
  agility:    { label: 'Agilidade',   abbr: 'AGI', desc: 'Velocidade e precisão de movimento. Define a iniciativa em combate, a evasão e a velocidade geral. Influencia armas leves e habilidades de movimentação rápida.' },
  resistance: { label: 'Resistência', abbr: 'RES', desc: 'Durabilidade física e vitalidade. Determina os Pontos de Vida e a mitigação de dano físico, e reduz penalidades de exaustão em longas marchas.' },
  intellect:  { label: 'Intelecto',   abbr: 'INT', desc: 'Raciocínio, memória e capacidade técnica. Base das perícias Engenharia, Alquimia e Medicina, e dos pontos de perícia de campo por nível. Ajuda a identificar itens e Ætherium.' },
  perception: { label: 'Percepção',   abbr: 'PER', desc: 'Atenção, sentidos e leitura do ambiente. Define o acerto à distância e a detecção de ameaças, armadilhas e segredos. Base de Investigação, Arqueologia e Negociação.' },
  sanity:     { label: 'Sanidade',    abbr: 'SAN', desc: 'Estabilidade mental e resistência psicológica. Resistência direta aos efeitos mutagênicos e psicológicos da névoa; define quanto tempo você suporta névoa densa. Base da perícia Religião.' }
};

const GRADE_LABELS = {
  5: 'E', 6: 'E+', 7: 'D-', 8: 'D', 9: 'D+', 10: 'C-'
};

function gradeLabel(value) {
  return GRADE_LABELS[value] || `${value}`;
}

// Modificador Grande (letra) de um valor de atributo (1..21) -> 1..7.
function mgOf(value) {
  return Math.max(1, Math.ceil(value / 3));
}

// Perícias de combate iniciais por classe (nível 2). Espelha o backend.
const INITIAL_SKILLS_BY_CLASS = {
  vagante_nevoas:  ['armas_brancas_leves', 'armas_fogo_leves', 'armaduras_leves'],
  arauto_conclave: ['dispositivos_combate', 'armaduras_leves', 'medicina_combate'],
  exilado_ferro:   ['armas_brancas_pesadas', 'armaduras_pesadas', 'escudos_bloqueio'],
  confessor_veu:   ['medicina_combate', 'armaduras_leves', 'armas_brancas_leves'],
  cronista_ruinas: ['armas_fogo_leves', 'armaduras_leves', 'combate_desarmado'],
};

const ATTR_ABBR = {
  strength: 'FOR', agility: 'AGI', resistance: 'RES',
  intellect: 'INT', perception: 'PER', sanity: 'SAN'
};

// Um atributo (valor final) atende o requisito de MG de uma perícia?
function skillRequirementMet(skill, finalAttrs) {
  const req = skill.attr_mg_req || 0;
  if (req <= 0) return true;
  const a = mgOf(finalAttrs[skill.base_attr] ?? 0);
  const b = skill.base_attr_alt ? mgOf(finalAttrs[skill.base_attr_alt] ?? 0) : 0;
  return Math.max(a, b) >= req;
}

// ─── Seleção de personagens ──────────────────────────────────────────
function CharacterSelect({ characters, onSelect, onCreate, onLogout, username }) {
  // 5 slots agora
  const emptySlots = Array.from({ length: 5 - characters.length });

  return (
    <div className="char-page">
      <div className="char-header">
        <h1 className="char-title">MISTS OF KRAKOVIA</h1>
        <p className="char-subtitle text-dim">
          Bem-vindo, <span className="text-gold">{username}</span>.
          Escolha seu personagem.
        </p>
      </div>

      <div className="char-slots">
        {characters.map(char => (
          <div
            key={char.id}
            className="char-slot occupied"
            onClick={() => onSelect(char)}
          >
            <div className="slot-class text-gold">
              {CLASS_INFO[char.class]?.label || char.class}
            </div>
            <div className="slot-name">{char.name}</div>
            <div className="slot-meta text-dim">
              Nível {char.level} &middot; {char.xp} XP
            </div>
            <div className="slot-stats">
              <span>
                PV {char.character_derived?.hp_current ?? '—'}/
                   {char.character_derived?.hp_max ?? '—'}
              </span>
              <span>
                STM {char.character_derived?.stamina_current ?? '—'}/
                    {char.character_derived?.stamina_max ?? '—'}
              </span>
            </div>
            <div className="slot-action">Jogar →</div>
          </div>
        ))}

        {emptySlots.map((_, i) => (
          <div
            key={`empty-${i}`}
            className="char-slot empty"
            onClick={onCreate}
          >
            <div className="slot-empty-icon">+</div>
            <div className="slot-empty-label text-dim">Criar Personagem</div>
          </div>
        ))}
      </div>

      <button className="btn-ghost" onClick={onLogout}>
        Sair da conta
      </button>
    </div>
  );
}

// ─── Criação de personagem — 3 etapas ───────────────────────────────
function CharacterCreate({ onCancel, onCreated }) {
  const [step, setStep]                   = useState(1); // 1=classe 2=nome+atrib 3=perícias 4=confirmação
  const [name, setName]                   = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [attributes, setAttributes]       = useState({
    strength: 0, agility: 0, resistance: 0,
    intellect: 0, perception: 0, sanity: 0
  });
  // Alocação de perícias: { field: { slug: pts }, combat: { slug: pts } }
  const [skillAlloc, setSkillAlloc] = useState({ field: {}, combat: {} });
  const [catalog, setCatalog]       = useState([]);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await skillService.getCatalog();
        if (!cancelled) setCatalog(data || []);
      } catch (err) {
        console.error('Erro ao carregar catálogo de perícias:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const pointsUsed = Object.values(attributes).reduce((a, b) => a + b, 0);
  const pointsLeft = 5 - pointsUsed;

  // Atributos finais (base E=5 + investido).
  const finalAttrs = {
    strength:   5 + attributes.strength,
    agility:    5 + attributes.agility,
    resistance: 5 + attributes.resistance,
    intellect:  5 + attributes.intellect,
    perception: 5 + attributes.perception,
    sanity:     5 + attributes.sanity,
  };

  // Pontos de perícia disponíveis (Volume III).
  const fieldPointsTotal  = 1 + mgOf(finalAttrs.intellect);
  const combatPointsTotal = 3;
  const fieldSpent  = Object.values(skillAlloc.field).reduce((a, b) => a + b, 0);
  const combatSpent = Object.values(skillAlloc.combat).reduce((a, b) => a + b, 0);
  const fieldLeft   = fieldPointsTotal  - fieldSpent;
  const combatLeft  = combatPointsTotal - combatSpent;

  const classInitial = INITIAL_SKILLS_BY_CLASS[selectedClass] || [];

  // Nível de partida de uma perícia (2 se for inicial da classe, senão 0).
  function baseLevel(slug) {
    return classInitial.includes(slug) ? 2 : 0;
  }

  function adjustAttr(key, delta) {
    const next = attributes[key] + delta;
    if (next < 0) return;
    if (next > 4) return; // teto D+ na criação (base E=5 + 4 = D+=9)
    if (delta > 0 && pointsLeft === 0) return;
    setAttributes(prev => ({ ...prev, [key]: next }));
  }

  function adjustSkill(type, slug, delta) {
    const current = skillAlloc[type][slug] || 0;
    const next = current + delta;
    if (next < 0) return;
    const left = type === 'field' ? fieldLeft : combatLeft;
    if (delta > 0 && left === 0) return;
    if (baseLevel(slug) + next > 10) return; // teto nível 10
    setSkillAlloc(prev => ({
      ...prev,
      [type]: { ...prev[type], [slug]: next }
    }));
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      await characterService.create(name, selectedClass, attributes, skillAlloc);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar personagem.');
    } finally {
      setLoading(false);
    }
  }

  // ── Etapa 1: Classe
  if (step === 1) return (
    <div className="create-page">
      <div className="create-card wide">
        <div className="create-step-label text-dim">Etapa 1 de 4</div>
        <h2 className="create-title">Quem você é?</h2>
        <div className="class-grid">
          {Object.entries(CLASS_INFO).map(([key, info]) => (
            <div
              key={key}
              className={`class-card ${selectedClass === key ? 'selected' : ''}`}
              onClick={() => setSelectedClass(key)}
            >
              <div className="class-label text-gold">{info.label}</div>
              <div className="class-subtitle text-dim">{info.subtitle}</div>
              <p className="class-desc">{info.description}</p>
              <div className="class-skills text-dim">{info.skills}</div>
            </div>
          ))}
        </div>
        <div className="create-actions">
          <button className="btn-ghost" onClick={onCancel}>Voltar</button>
          <button
            className="btn-primary"
            onClick={() => setStep(2)}
            disabled={!selectedClass}
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );

  // ── Etapa 2: Nome + Atributos
  if (step === 2) {
    

    return (
      <div className="create-page">
        <div className="create-card">
          <div className="create-step-label text-dim">Etapa 2 de 4</div>
          <h2 className="create-title">Nome e capacidades</h2>

          {/* Nome */}
          <div className="field" style={{ marginBottom: 24 }}>
            <label>Nome do personagem</label>
            <input
              className="create-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Como você se chama?"
              maxLength={20}
              autoFocus
            />
            <div className="create-char-count text-dim">{name.length}/20</div>
          </div>

          {/* Atributos */}
          <p className="create-desc text-dim font-narrative">
            Distribua{' '}
            <span className="text-gold">
              {pointsLeft} ponto{pointsLeft !== 1 ? 's' : ''}
            </span>
            {' '}entre os atributos. Todos começam no grau E.
          </p>

          <div className="attr-list">
            {Object.entries(ATTR_LABELS).map(([key, info]) => {
              const value = 5 + attributes[key];
              return (
                <div key={key} className="attr-row">
                  <div className="attr-info">
                    <span className="attr-label">{info.label}</span>
                    <span className="attr-desc text-dim">{info.desc}</span>
                  </div>
                  <div className="attr-control">
                    <button
                      className="attr-btn"
                      onClick={() => adjustAttr(key, -1)}
                      disabled={attributes[key] === 0}
                    >−</button>
                    <span className="attr-value">
                      {gradeLabel(value)}
                      <span className="attr-numeric text-dim"> ({value})</span>
                    </span>
                    <button
                      className="attr-btn"
                      onClick={() => adjustAttr(key, 1)}
                      disabled={pointsLeft === 0 || attributes[key] >= 4}
                    >+</button>
                  </div>
                </div>
              );
            })}

            
          </div>

          <div className="create-actions">
            <button className="btn-ghost" onClick={() => setStep(1)}>Voltar</button>
            <button
              className="btn-primary"
              onClick={() => setStep(3)}
              disabled={name.trim().length < 2}
            >
              Perícias →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Etapa 3: Perícias
  if (step === 3) {
    const fieldSkills  = catalog.filter(s => s.skill_type === 'field');
    const combatSkills = catalog.filter(s => s.skill_type === 'combat');

    function SkillRow({ skill, type }) {
      const invested = skillAlloc[type][skill.slug] || 0;
      const level = baseLevel(skill.slug) + invested;
      const met = skillRequirementMet(skill, finalAttrs);
      const isInitial = classInitial.includes(skill.slug);
      const left = type === 'field' ? fieldLeft : combatLeft;
      return (
        <div className={`attr-row ${!met ? 'skill-locked' : ''}`} style={!met ? { opacity: 0.5 } : undefined}>
          <div className="attr-info">
            <span className="attr-label">
              {skill.name}
              {isInitial && <span className="text-gold"> · inicial</span>}
            </span>
            <span className="attr-desc text-dim">
              {ATTR_ABBR[skill.base_attr]}
              {skill.base_attr_alt ? `/${ATTR_ABBR[skill.base_attr_alt]}` : ''}
              {skill.attr_mg_req > 0 ? ` · requer ${ATTR_ABBR[skill.base_attr]} grau ${'FEDCBAS'[skill.attr_mg_req - 1]}` : ''}
              {skill.requires_training ? ' · requer treinamento' : ''}
            </span>
            {skill.description && (
              <span className="attr-desc text-dim" style={{ marginTop: 2, fontStyle: 'italic' }}>
                {skill.description}
              </span>
            )}
          </div>
          <div className="attr-control">
            <button
              className="attr-btn"
              onClick={() => adjustSkill(type, skill.slug, -1)}
              disabled={invested === 0}
            >−</button>
            <span className="attr-value">
              {level}
            </span>
            <button
              className="attr-btn"
              onClick={() => adjustSkill(type, skill.slug, 1)}
              disabled={!met || left === 0 || level >= 10}
            >+</button>
          </div>
        </div>
      );
    }

    return (
      <div className="create-page">
        <div className="create-card">
          <div className="create-step-label text-dim">Etapa 3 de 4</div>
          <h2 className="create-title">Perícias</h2>
          <p className="create-desc text-dim font-narrative">
            As perícias de combate da sua classe já começam no nível 2. Distribua{' '}
            <span className="text-gold">{combatLeft}</span> ponto(s) de combate e{' '}
            <span className="text-gold">{fieldLeft}</span> de campo.
          </p>

          <div className="section-label text-dim" style={{ marginTop: 12 }}>
            Combate · {combatLeft}/{combatPointsTotal} pontos
          </div>
          <div className="attr-list">
            {combatSkills.map(s => <SkillRow key={s.slug} skill={s} type="combat" />)}
          </div>

          <div className="section-label text-dim" style={{ marginTop: 16 }}>
            Campo · {fieldLeft}/{fieldPointsTotal} pontos
          </div>
          <div className="attr-list">
            {fieldSkills.map(s => <SkillRow key={s.slug} skill={s} type="field" />)}
          </div>

          <div className="create-actions">
            <button className="btn-ghost" onClick={() => setStep(2)}>Voltar</button>
            <button className="btn-primary" onClick={() => setStep(4)}>
              Revisar →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Etapa 4: Confirmação
  if (step === 4) return (
    <div className="create-page">
      <div className="create-card">
        <div className="create-step-label text-dim">Etapa 4 de 4</div>
        <h2 className="create-title">Confirmar personagem</h2>

        <div className="review-block">
          <div className="review-row">
            <span className="text-dim">Nome</span>
            <span className="text-gold">{name}</span>
          </div>
          <div className="review-row">
            <span className="text-dim">Classe</span>
            <span>{CLASS_INFO[selectedClass]?.label}</span>
          </div>
        </div>

        <div className="review-attrs">
          {Object.entries(ATTR_LABELS).map(([key, info]) => (
            <div key={key} className="review-attr-row">
              <span className="text-dim">{info.abbr}</span>
              <span className={attributes[key] > 0 ? 'text-gold' : ''}>
                {gradeLabel(5 + attributes[key])}
              </span>
            </div>
          ))}
        </div>

        <p className="review-warning text-dim font-narrative">
          Atributos e classe não podem ser alterados após a criação.
        </p>

        {error && <p className="login-error">{error}</p>}

        <div className="create-actions">
          <button
            className="btn-ghost"
            onClick={() => setStep(3)}
            disabled={loading}
          >
            Voltar
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Entrar no Mundo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────
export default function CharactersPage() {
  const navigate                          = useNavigate();
  const { user, logout, selectCharacter } = useGame();
  const [characters, setCharacters]       = useState([]);
  const [creating, setCreating]           = useState(false);
  const [loading, setLoading]             = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await characterService.list();
        if (!cancelled) setCharacters(data);
      } catch (err) {
        console.error('Erro ao carregar personagens:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  function reloadCharacters() {
    setLoading(true);
    setRefreshKey(k => k + 1);
  }

  function handleSelect(char) {
    selectCharacter(char);
    navigate('/game');
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleCreated() {
    setCreating(false);
    reloadCharacters();
  }

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      color: '#c9a84c'
    }}>
      Carregando...
    </div>
  );

  if (creating) return (
    <CharacterCreate
      onCancel={() => setCreating(false)}
      onCreated={handleCreated}
    />
  );

  return (
    <CharacterSelect
      characters={characters}
      onSelect={handleSelect}
      onCreate={() => setCreating(true)}
      onLogout={handleLogout}
      username={user?.username}
    />
  );
}