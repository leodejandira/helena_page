// state.js
// Estado global da aplicação + configurações (nada de lógica aqui).

// --- Configurações de domínio ---
// Alterar aqui reflete automaticamente em filtros e formulário de cadastro.

const GROUPS = [
    "Casa",
    "Angelo",
    "BB",
    "IBM",
    "Pessoal"
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

// Status possíveis + cor do badge + classe css
const STATUSES = [
    { value: "Preparada",     badgeClass: "bg-preparada" },
    { value: "Em andamento",  badgeClass: "bg-andamento" },
    { value: "Concluída",     badgeClass: "bg-concluida" },
    { value: "Cancelado",     badgeClass: "bg-cancelado" }
];

// Status que ainda podem ser trabalhados (têm timer / podem ser cancelados)
const ACTIVE_STATUSES = ["Preparada", "Em andamento"];

// Status finais (sem timer, somente leitura)
const FINAL_STATUSES = ["Concluída", "Cancelado"];

// Filtros rápidos de status disponíveis na tela inicial
const STATUS_FILTERS = {
    ativas:     { label: "Ativas",     statuses: ["Preparada", "Em andamento"] },
    todas:      { label: "Todas",      statuses: null }, // null = sem restrição
    concluidas: { label: "Concluídas", statuses: ["Concluída"] },
    canceladas: { label: "Canceladas", statuses: ["Cancelado"] }
};

// --- Estado global ---
let allTasks = [];
let currentStatusFilter = "ativas"; // filtro padrão ao abrir a tela

// Variáveis do timer
let activeTask = null;
let timerInterval = null;
let elapsedSeconds = 0;
