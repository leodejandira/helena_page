// filters.js
// Responsável por: montar opções de filtro, aplicar filtros e status padrão.

/**
 * Preenche os <select> de filtro e cadastro com base nas configurações
 * definidas em state.js (GROUPS, CATEGORIES, COMPLEXITIES, CRITICALITIES).
 */
function populateFilterOptions() {
    fillSelect("f-grupo", GROUPS, "Todos");
    fillSelect("f-categoria", CATEGORIES, "Todas");
    fillSelect("f-complex", COMPLEXITIES, "Todas");
    fillSelect("f-crit", CRITICALITIES, "Todas");

    fillSelect("t-grupo", GROUPS);
    fillSelect("t-categoria", CATEGORIES);
    fillSelect("t-complex", COMPLEXITIES);
    fillSelect("t-crit", CRITICALITIES);
}

/**
 * Preenche um elemento <select> com uma lista de valores.
 * @param {string} selectId id do elemento select
 * @param {Array<string>} values valores das options
 * @param {string|null} emptyLabel se informado, cria uma option vazia no topo (ex: "Todos")
 */
function fillSelect(selectId, values, emptyLabel = null) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = "";

    if (emptyLabel !== null) {
        const optEmpty = document.createElement("option");
        optEmpty.value = "";
        optEmpty.textContent = emptyLabel;
        select.appendChild(optEmpty);
    }

    values.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
    });
}

/**
 * Renderiza os botões de filtro rápido de status (Ativas / Todas / Concluídas / Canceladas).
 */
function renderStatusFilterButtons() {
    const container = document.getElementById("status-filter");
    if (!container) return;

    container.innerHTML = "";

    Object.entries(STATUS_FILTERS).forEach(([key, cfg]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "status-filter-btn" + (key === currentStatusFilter ? " active" : "");
        btn.textContent = cfg.label;
        btn.onclick = () => setStatusFilter(key);
        container.appendChild(btn);
    });
}

/**
 * Define o filtro rápido de status ativo e re-renderiza a tabela.
 * @param {string} key uma das chaves de STATUS_FILTERS
 */
function setStatusFilter(key) {
    if (!STATUS_FILTERS[key]) return;
    currentStatusFilter = key;
    renderStatusFilterButtons();
    renderTable();
}

/**
 * Aplica todos os filtros (status rápido + grupo/categoria/complexidade/criticidade/custo/data)
 * sobre a lista completa de tarefas.
 * @returns {Array} lista filtrada
 */
function getFilteredTasks() {
    const allowedStatuses = STATUS_FILTERS[currentStatusFilter].statuses;

    const fg = document.getElementById("f-grupo").value;
    const fc = document.getElementById("f-categoria").value;
    const fx = document.getElementById("f-complex").value;
    const fcr = document.getElementById("f-crit").value;
    const fCustoMax = parseFloat(document.getElementById("f-custo-max").value);
    const fDataMax = document.getElementById("f-data-max").value;

    return allTasks.filter(t => {
        if (allowedStatuses && !allowedStatuses.includes(t.status)) return false;
        if (fg && t.grupo !== fg) return false;
        if (fc && t.categoria !== fc) return false;
        if (fx && t.complexidade !== fx) return false;
        if (fcr && t.criticidade !== fcr) return false;
        if (!isNaN(fCustoMax) && t.custo > fCustoMax) return false;
        if (fDataMax && t.data_limite && t.data_limite > fDataMax) return false;
        return true;
    });
}
