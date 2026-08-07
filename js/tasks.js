// tasks.js
// Responsável por: renderização da tabela, criação, atualização, cancelamento e conclusão.

/**
 * Busca as tarefas no backend e atualiza a tabela.
 */
async function loadTasks() {
    try {
        allTasks = await fetchTasks();
        renderTable();
    } catch (e) {
        console.error("Erro ao buscar tarefas", e);
        alert("Não foi possível carregar as tarefas. Tente novamente.");
    }
}

/**
 * Envia uma atualização parcial de uma tarefa para o backend e
 * recarrega a lista local (mantém tudo sincronizado com o banco).
 * @param {number} id
 * @param {Object} partialData
 * @param {Object} [opts] { silent: true } evita recarregar a tabela automaticamente
 */
async function updateTaskAPI(id, partialData, opts = {}) {
    const updated = await updateTask(id, partialData);

    // Atualiza a lista em memória
    const idx = allTasks.findIndex(t => t.id === id);
    if (idx !== -1) allTasks[idx] = updated;

    if (!opts.silent) {
        renderTable();
    }
    return updated;
}

/**
 * Retorna a configuração (classe do badge) de um status.
 */
function getStatusConfig(status) {
    return STATUSES.find(s => s.value === status) || STATUSES[0];
}

/**
 * Renderiza a tabela de tarefas de acordo com os filtros ativos.
 */
function renderTable() {
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";

    const filtered = getFilteredTasks();

    if (filtered.length === 0) {
        const tr = document.createElement("tr");
        tr.className = "empty-row";
        tr.innerHTML = `<td colspan="7">Nenhuma tarefa encontrada.</td>`;
        tbody.appendChild(tr);
        return;
    }

    filtered.forEach(t => {
        const badge = getStatusConfig(t.status).badgeClass;
        const canCancel = ACTIVE_STATUSES.includes(t.status);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${t.item}</strong></td>
            <td>${t.grupo}</td>
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

        const cancelBtn = tr.querySelector(".btn-cancel-task");
        if (cancelBtn) {
            cancelBtn.onclick = () => cancelTask(t.id);
        }

        tbody.appendChild(tr);
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
        alert("Tarefa salva!");
        await loadTasks();
    } catch (err) {
        console.error(err);
        alert("Não foi possível salvar a tarefa. Tente novamente.");
    }
}

/**
 * Cancela uma tarefa (a partir da tabela). Não deleta - apenas muda o status.
 * @param {number} id
 */
async function cancelTask(id) {
    const confirmed = confirm("Tem certeza que deseja cancelar esta tarefa?");
    if (!confirmed) return;

    try {
        await updateTaskAPI(id, { status: "Cancelado" });
    } catch (err) {
        console.error(err);
        alert("Não foi possível cancelar a tarefa. Tente novamente.");
    }
}

/**
 * Cancela a tarefa atualmente aberta no modal.
 */
async function cancelActiveTaskFromModal() {
    if (!activeTask) return;
    const confirmed = confirm("Tem certeza que deseja cancelar esta tarefa?");
    if (!confirmed) return;

    pauseTimer();
    try {
        await updateTaskAPI(activeTask.id, { status: "Cancelado" });
        closeModal();
    } catch (err) {
        console.error(err);
        alert("Não foi possível cancelar a tarefa. Tente novamente.");
    }
}
