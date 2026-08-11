// state.js
// Estado global da aplicação + configurações (nada de lógica de negócio aqui).

// --- Configurações de domínio ---
// Alterar aqui reflete automaticamente em filtros, formulário de cadastro e badges.

const GROUPS = [
    "Casa",
    "Angelo",
    "BB",
    "IBM",
    "Pessoal",
    "Carreira/Estudos",
    "Angelo"
];

const CATEGORIES = [
    "Tarefa",
    "Compra"
];

const COMPLEXITIES = [
    "Baixa",
    "Média",
    "Alta"
];

const CRITICALITIES = [
    "Normal",
    "Urgente"
];

// Status possíveis + classe css do badge
const STATUSES = [
    { value: "Preparada",     badgeClass: "bg-preparada" },
    { value: "Em andamento",  badgeClass: "bg-andamento" },
    { value: "Concluída",     badgeClass: "bg-concluida" },
    { value: "Cancelado",     badgeClass: "bg-cancelado" }
];

// Status que ainda podem ser trabalhados (têm timer / podem ser cancelados)
const ACTIVE_STATUSES = ["Preparada", "Em andamento"];

// Status finais (sem timer)
const FINAL_STATUSES = ["Concluída", "Cancelado"];

// Filtros rápidos de status disponíveis na tela inicial
const STATUS_FILTERS = {
    ativas:     { label: "Ativas",     statuses: ["Preparada", "Em andamento"] },
    todas:      { label: "Todas",      statuses: null }, // null = sem restrição
    concluidas: { label: "Concluídas", statuses: ["Concluída"] },
    canceladas: { label: "Canceladas", statuses: ["Cancelado"] }
};

// --- Identidade visual dos grupos ---
// Ponto único de configuração de cores. Nenhum outro arquivo deve
// hardcodar cor de grupo - todos consultam este mapa via getGroupBadgeClass().
const GROUP_COLORS = {
    BB: "blue",
    IBM: "purple",
    Pessoal: "green",
    Casa: "orange",
    Angelo: "red"
};

/**
 * Retorna a classe CSS do badge de um grupo, com fallback seguro
 * para grupos não mapeados em GROUP_COLORS.
 * @param {string} grupo
 * @returns {string}
 */
function getGroupBadgeClass(grupo) {
    const color = GROUP_COLORS[grupo] || "gray";
    return `grupo-${color}`;
}

// --- Estado global ---
let allTasks = [];
let currentStatusFilter = "ativas"; // filtro padrão ao abrir a tela

// Variáveis do timer
let activeTask = null;
let timerInterval = null;
let elapsedSeconds = 0;
