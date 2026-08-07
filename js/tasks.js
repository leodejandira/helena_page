// tasks.js
// Responsável por: renderização da tabela (desktop) e cards (mobile),
// criação, cancelamento de tarefas, e orquestração do fluxo de conclusão.
//
// A regra "não pode concluir com dependências pendentes" mora em
// dependencies.js; aqui apenas chamamos e reagimos ao resultado.
// O controle de tempo em si (iniciar/pausar/somar horas) mora em timer.js.

/**
 * Busca as tarefas no backend e atualiza tabela/cards.
 */
async function loadTasks() {
    const loadingEl = document.getElementById("tasks-loading");
    if (loadingEl) loadingEl.style.display = "block";

    try {
        allTasks = await fetchTasks();
        renderTable();
    } catch (e) {
        console.error("Erro ao buscar tarefas", e);
        showToast("Não foi possível carregar as tarefas. Tente novamente.", "error");
    } finally {
        if (loadingEl) loadingEl.style.display = "none";
    }
}

/**
 * Envia uma atualização parcial de uma tarefa para o backend e
 * mantém a lista local sincronizada.
 * @param {number} id
 * @param {Object} partialData
 * @param {Object} [opts] { silent: true } evita re-renderizar automaticamente
 */
async function updateTaskAPI(id, partialData, opts = {}) {
    const updated = await updateTask(id, partialData);

    const idx = allTasks.findIndex(t => t.id === id);
    if (idx !== -1) allTasks[idx] = updated;

    if (!opts.silent) {
        renderTable();
    }
    return updated;
}

function getStatusConfig(status) {
    return STATUSES.find(s => s.value === status) || STATUSES[0];
}

function renderGroupBadgeHTML(grupo) {
    return `<span class="grupo-badge ${getGroupBadgeClass(grupo)}">${grupo}</span>`;
}

/**
 * Renderiza a lista de tarefas filtrada tanto na tabela (desktop)
 * quanto nos cards (mobile). CSS decide qual das duas fica visível.
 */
function renderTable() {
    const tbody = document.getElementById("table-body");
    const cardsContainer = document.getElementById("cards-body");
    if (!tbody || !cardsContainer) return;

    tbody.innerHTML = "";
    cardsContainer.innerHTML = "";

    const filtered = getFilteredTasks();

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Nenhuma tarefa encontrada.</td></tr>`;
        cardsContainer.innerHTML = `<div class="empty-state">Nenhuma tarefa encontrada.</div>`;
        return;
    }

    filtered.forEach(t => {
        const badge = getStatusConfig(t.status).badgeClass;
        const canCancel = ACTIVE_STATUSES.includes(t.status);

        // --- linha da tabela (desktop) ---
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${t.item}</strong></td>
            <td>${renderGroupBadgeHTML(t.grupo)}</td>
            <td><span class="status-badge ${badge}">${t.status}</span></td>
            <td>${t.criticidade || "-"}</td>
            <td>R$ ${Number(t.custo || 0).toFixed(2)}</td>
            <td>${Number(t.tempo_gasto_h || 0).toFixed(2)} h</td>
            <td class="col-actions">
                <button type="button" class="btn-small btn-open">Abrir</button>
                ${canCancel ? `<button type="button" class="btn-small btn-cancel-task">Cancelar</button>` : ""}
            </td>
        `;
        tr.querySelector(".btn-open").onclick = () => openModal(t);
        const cancelBtnRow = tr.querySelector(".btn-cancel-task");
        if (cancelBtnRow) cancelBtnRow.onclick = () => cancelTask(t.id);
        tbody.appendChild(tr);

        // --- card (mobile) ---
        const card = document.createElement("div");
        card.className = "task-card";
        card.innerHTML = `
            <div class="task-card-header">
                <strong>${t.item}</strong>
                ${renderGroupBadgeHTML(t.grupo)}
            </div>
            <div class="task-card-row"><span>Status:</span><span class="status-badge ${badge}">${t.status}</span></div>
            <div class="task-card-row"><span>Criticidade:</span><span>${t.criticidade || "-"}</span></div>
            <div class="task-card-row"><span>Custo:</span><span>R$ ${Number(t.custo || 0).toFixed(2)}</span></div>
            <div class="task-card-row"><span>Tempo gasto:</span><span>${Number(t.tempo_gasto_h || 0).toFixed(2)} h</span></div>
            <div class="task-card-actions">
                <button type="button" class="btn-open">Abrir</button>
                ${canCancel ? `<button type="button" class="btn-cancel-task">Cancelar</button>` : ""}
            </div>
        `;
        card.querySelector(".btn-open").onclick = () => openModal(t);
        const cancelBtnCard = card.querySelector(".btn-cancel-task");
        if (cancelBtnCard) cancelBtnCard.onclick = () => cancelTask(t.id);
        cardsContainer.appendChild(card);
    });
}

/**
 * Cria uma nova tarefa a partir do formulário de cadastro.
 */
async function handleCreateTask(e) {
    e.preventDefault();

    const payload = {
        item: document.getElementById("t-nome").value,
        grupo: document.getElementById("t-grupo").value,
        categoria: document.getElementById("t-categoria").value,
        complexidade: document.getElementById("t-complex").value,
        criticidade: document.getElementById("t-crit").value,
        custo: parseFloat(document.getElementById("t-custo").value || 0),
        tempo_ext_h: parseFloat(document.getElementById("t-tempo-ext").value || 0),
        data_limite: document.getElementById("t-data").value || null,
        status: "Preparada",
        tempo_gasto_h: 0.0
    };

    try {
        await createTask(payload);
        document.getElementById("task-form").reset();
        showToast("Tarefa salva!", "success");
        await loadTasks();
    } catch (err) {
        console.error(err);
        showToast("Não foi possível salvar a tarefa. Tente novamente.", "error");
    }
}

/**
 * Cancela uma tarefa (a partir da tabela/cards). Não deleta - apenas muda o status.
 * @param {number} id
 */
async function cancelTask(id) {
    if (!confirmDestructive("Tem certeza que deseja cancelar esta tarefa?")) return;

    try {
        await updateTaskAPI(id, { status: "Cancelado" });
        showToast("Tarefa cancelada.", "success");
    } catch (err) {
        console.error(err);
        showToast("Não foi possível cancelar a tarefa. Tente novamente.", "error");
    }
}

/**
 * Cancela a tarefa atualmente aberta no modal.
 */
async function cancelActiveTaskFromModal() {
    if (!activeTask) return;
    if (!confirmDestructive("Tem certeza que deseja cancelar esta tarefa?")) return;

    pauseTimer();
    try {
        await updateTaskAPI(activeTask.id, { status: "Cancelado" });
        showToast("Tarefa cancelada.", "success");
        closeModal();
    } catch (err) {
        console.error(err);
        showToast("Não foi possível cancelar a tarefa. Tente novamente.", "error");
    }
}

/**
 * Orquestra a conclusão de uma tarefa. Fluxo:
 * 1. Para o timer (controle de tempo puro, delegado a timer.js)
 * 2. Valida dependências (regra de negócio, delegada a dependencies.js)
 * 3. Se houver bloqueio, avisa o usuário e interrompe (não conclui)
 * 4. Se liberado, soma o tempo da sessão ao tempo já salvo e persiste
 *    a tarefa como "Concluída"
 * @param {Object} task tarefa atualmente aberta no modal
 */
async function completeTask(task) {
    if (!task) return;

    pauseTimer();

    let depCheck;
    try {
        depCheck = await checkDependencies(task);
    } catch (err) {
        console.error("Erro ao verificar dependências", err);
        showToast("Não foi possível verificar as dependências desta tarefa. Tente novamente.", "error");
        return;
    }

    if (!depCheck.ok) {
        showToast(formatDependencyBlockMessage(depCheck.bloqueios), "warning", 6000);
        return;
    }

    const horasAdicionadas = getElapsedHours();
    const novoTempoGasto = (task.tempo_gasto_h || 0) + horasAdicionadas;

    try {
        await updateTaskAPI(task.id, {
            tempo_gasto_h: novoTempoGasto,
            status: "Concluída"
        });
        resetElapsedTime();
        showToast("Tarefa concluída com sucesso!", "success");
        closeModal();
    } catch (err) {
        console.error(err);
        showToast("Não foi possível concluir a tarefa. Tente novamente.", "error");
    }
}
