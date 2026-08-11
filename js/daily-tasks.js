// daily-tasks.js
// Responsável por: estado e renderização da aba "Tarefas de Hoje",
// adicionar/remover tarefas do dia, reordenação, e as ações de
// concluir/cancelar diretamente na lista de hoje.
//
// NÃO reimplementa timer nem modal: para abrir uma tarefa de hoje, reusa
// openModal(task) (modal.js) com o mesmo objeto de `items` já usado na
// lista normal. A partir daí, iniciar/pausar/concluir/cancelar pelo modal
// seguem o fluxo existente em timer.js/tasks.js sem nenhuma duplicação -
// o backend (PUT /items/{id} -> RPC sync_item_status) já sincroniza o
// registro do dia sozinho quando aplicável.
//
// `todayMap` (item_id -> registro de daily_tasks de HOJE) é usado por
// tasks.js para decidir o texto do botão "Adicionar/Remover das tarefas
// de hoje" na lista normal.

let dailyTasks = [];           // registros de daily_tasks da data atualmente exibida na aba
let todayMap = {};             // item_id -> registro de daily_tasks de HOJE (usado na lista normal)

/**
 * Retorna a data de hoje no formato YYYY-MM-DD, no fuso local do navegador.
 * Usado apenas para exibição/consulta; a definição oficial de "hoje" para
 * fins de criação de registros é sempre feita pelo backend em
 * America/Sao_Paulo (ver daily_task_controller.py).
 */
function getLocalISODate() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function isDailyTasksTabActive() {
    const content = document.getElementById("tab-2");
    return !!content && content.classList.contains("active");
}

/**
 * Carrega o mapa item_id -> daily_task de HOJE. Usado pela lista normal
 * de tarefas para saber se cada item já está (ou não) nas tarefas de hoje.
 * Falha de forma silenciosa (não bloqueia a lista normal) se o backend de
 * daily-tasks estiver indisponível.
 */
async function loadTodayMap() {
    try {
        const rows = await fetchDailyTasks();
        todayMap = {};
        rows.forEach(row => { todayMap[row.item_id] = row; });
    } catch (e) {
        console.error("Erro ao buscar tarefas de hoje", e);
        todayMap = {};
    }
}

/**
 * Carrega e renderiza a aba "Tarefas de Hoje".
 */
async function loadDailyTasks() {
    const loadingEl = document.getElementById("daily-tasks-loading");
    if (loadingEl) loadingEl.style.display = "block";

    try {
        // A aba de hoje sempre reflete a data atual; se allTasks ainda não
        // tiver sido carregado (ex.: usuário navega direto para esta aba),
        // garantimos que os dados dos items estejam disponíveis para
        // exibir nome/grupo/status de cada linha.
        if (!Array.isArray(allTasks) || allTasks.length === 0) {
            allTasks = await fetchTasks();
        }

        dailyTasks = await fetchDailyTasks();

        // Mantém o todayMap sincronizado com o que acabamos de carregar,
        // já que ambos representam a mesma data (hoje).
        todayMap = {};
        dailyTasks.forEach(row => { todayMap[row.item_id] = row; });

        renderDailyTasksTab();
    } catch (e) {
        console.error("Erro ao buscar tarefas de hoje", e);
        showToast("Não foi possível carregar as tarefas de hoje. Tente novamente.", "error");
    } finally {
        if (loadingEl) loadingEl.style.display = "none";
    }
}

function getDailyStatusLabel(statusDia) {
    switch (statusDia) {
        case "pendente": return { text: "Pendente", badge: "bg-preparada" };
        case "em_execucao": return { text: "Em execução", badge: "bg-andamento" };
        case "concluida": return { text: "Concluída", badge: "bg-concluida" };
        case "cancelada": return { text: "Cancelada", badge: "bg-cancelado" };
        default: return { text: statusDia, badge: "bg-preparada" };
    }
}

/**
 * Renderiza a tabela (desktop) e os cards (mobile) da aba "Tarefas de Hoje".
 */
function renderDailyTasksTab() {
    const tbody = document.getElementById("daily-tasks-table-body");
    const cardsContainer = document.getElementById("daily-tasks-cards-body");
    if (!tbody || !cardsContainer) return;

    tbody.innerHTML = "";
    cardsContainer.innerHTML = "";

    if (dailyTasks.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Nenhuma tarefa adicionada para hoje ainda.</td></tr>`;
        cardsContainer.innerHTML = `<div class="empty-state">Nenhuma tarefa adicionada para hoje ainda.</div>`;
        return;
    }

    // Ordenados por order_index (o backend já retorna assim, mas garantimos aqui)
    const ordered = [...dailyTasks].sort((a, b) => a.order_index - b.order_index);

    ordered.forEach((dt, idx) => {
        const item = allTasks.find(t => t.id === dt.item_id);
        const itemName = item ? item.item : `Tarefa #${dt.item_id} (não encontrada na lista)`;
        const grupoHTML = item ? renderGroupBadgeHTML(item.grupo) : "-";
        const statusInfo = getDailyStatusLabel(dt.status_dia);
        const isFinal = dt.status_dia === "concluida" || dt.status_dia === "cancelada";

        const position = idx + 1;
        const canMoveUp = idx > 0;
        const canMoveDown = idx < ordered.length - 1;

        // --- linha da tabela (desktop) ---
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <button type="button" class="btn-small btn-order" data-dir="up" ${canMoveUp ? "" : "disabled"}>↑</button>
                <button type="button" class="btn-small btn-order" data-dir="down" ${canMoveDown ? "" : "disabled"}>↓</button>
                <strong>${position}</strong>
            </td>
            <td><strong>${itemName}</strong> ${grupoHTML}</td>
            <td><span class="status-badge ${statusInfo.badge}">${statusInfo.text}</span></td>
            <td class="col-actions">
                ${item && !isFinal ? `<button type="button" class="btn-small btn-open">Abrir Timer</button>` : ""}
            </td>
            <td class="col-actions">
                ${!isFinal ? `
                    <button type="button" class="btn-small btn-complete-daily">Concluir</button>
                    <button type="button" class="btn-small btn-cancel-daily">Cancelar</button>
                ` : ""}
            </td>
            <td class="col-actions">
                <button type="button" class="btn-small btn-remove-daily">Remover de hoje</button>
            </td>
        `;

        wireDailyRowActions(tr, dt, item, canMoveUp, canMoveDown);
        tbody.appendChild(tr);

        // --- card (mobile) ---
        const card = document.createElement("div");
        card.className = "task-card";
        card.innerHTML = `
            <div class="task-card-header">
                <strong>${position}. ${itemName}</strong>
                ${grupoHTML}
            </div>
            <div class="task-card-row"><span>Status do dia:</span><span class="status-badge ${statusInfo.badge}">${statusInfo.text}</span></div>
            <div class="task-card-actions">
                <button type="button" class="btn-order" data-dir="up" ${canMoveUp ? "" : "disabled"}>↑ Subir</button>
                <button type="button" class="btn-order" data-dir="down" ${canMoveDown ? "" : "disabled"}>↓ Descer</button>
            </div>
            <div class="task-card-actions">
                ${item && !isFinal ? `<button type="button" class="btn-open">Abrir Timer</button>` : ""}
            </div>
            ${!isFinal ? `
            <div class="task-card-actions">
                <button type="button" class="btn-complete-daily">Concluir</button>
                <button type="button" class="btn-cancel-daily">Cancelar</button>
            </div>` : ""}
            <div class="task-card-actions">
                <button type="button" class="btn-remove-daily">Remover de hoje</button>
            </div>
        `;

        wireDailyRowActions(card, dt, item, canMoveUp, canMoveDown);
        cardsContainer.appendChild(card);
    });
}

/**
 * Liga os eventos de uma linha/card da aba "Tarefas de Hoje" (funciona
 * tanto para <tr> quanto para o card mobile, já que usam as mesmas classes).
 */
function wireDailyRowActions(el, dailyTask, item, canMoveUp, canMoveDown) {
    const openBtn = el.querySelector(".btn-open");
    if (openBtn && item) {
        openBtn.onclick = () => openModal(item);
    }

    const completeBtn = el.querySelector(".btn-complete-daily");
    if (completeBtn) {
        completeBtn.onclick = () => completeDailyTaskRow(dailyTask);
    }

    const cancelBtn = el.querySelector(".btn-cancel-daily");
    if (cancelBtn) {
        cancelBtn.onclick = () => cancelDailyTaskRow(dailyTask);
    }

    const removeBtn = el.querySelector(".btn-remove-daily");
    if (removeBtn) {
        removeBtn.onclick = () => removeFromToday(dailyTask, item);
    }

    el.querySelectorAll(".btn-order").forEach(btn => {
        const dir = btn.dataset.dir;
        if ((dir === "up" && !canMoveUp) || (dir === "down" && !canMoveDown)) return;
        btn.onclick = () => moveDailyTask(dailyTask.id, dir);
    });
}

/**
 * Adiciona ou remove um item das tarefas de hoje, a partir do botão exibido
 * na lista normal de tarefas (tasks.js). Reflete o estado real do backend,
 * nunca assume estado local.
 * @param {number} itemId
 */
async function toggleToday(itemId) {
    try {
        if (todayMap[itemId]) {
            await deleteDailyTask(todayMap[itemId].id);
            delete todayMap[itemId];
            showToast("Removida das tarefas de hoje.", "success");
        } else {
            const created = await createDailyTask(itemId);
            todayMap[itemId] = created;
            showToast("Adicionada às tarefas de hoje!", "success");
        }

        renderTable();

        if (isDailyTasksTabActive()) {
            await loadDailyTasks();
        }
    } catch (err) {
        console.error(err);
        showToast(err.message || "Não foi possível atualizar as tarefas de hoje.", "error");
    }
}

/**
 * Remove uma tarefa a partir da própria aba "Tarefas de Hoje" (botão
 * "Remover de hoje" na linha). Mesma operação de toggleToday, mas chamada
 * a partir do contexto oposto (já sabemos que está adicionada).
 */
async function removeFromToday(dailyTask, item) {
    if (!confirmDestructive("Remover esta tarefa das tarefas de hoje? A tarefa original não será excluída.")) return;

    try {
        await deleteDailyTask(dailyTask.id);
        if (item) delete todayMap[item.id];
        showToast("Removida das tarefas de hoje.", "success");
        await loadDailyTasks();
        renderTable();
    } catch (err) {
        console.error(err);
        showToast(err.message || "Não foi possível remover a tarefa de hoje.", "error");
    }
}

/**
 * Move uma tarefa de hoje uma posição para cima/baixo e persiste a nova
 * ordem inteira em uma única requisição em lote.
 * @param {number} dailyTaskId
 * @param {"up"|"down"} direction
 */
async function moveDailyTask(dailyTaskId, direction) {
    const ordered = [...dailyTasks].sort((a, b) => a.order_index - b.order_index);
    const idx = ordered.findIndex(dt => dt.id === dailyTaskId);
    if (idx === -1) return;

    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= ordered.length) return;

    // Troca as posições localmente (feedback visual imediato).
    [ordered[idx], ordered[swapWith]] = [ordered[swapWith], ordered[idx]];

    // Recalcula order_index sequencial (0, 1, 2, ...) e persiste em lote.
    const payloadItems = ordered.map((dt, i) => ({ id: dt.id, order_index: i }));

    // Atualiza o estado local otimisticamente para resposta imediata.
    dailyTasks = dailyTasks.map(dt => {
        const updated = payloadItems.find(p => p.id === dt.id);
        return updated ? { ...dt, order_index: updated.order_index } : dt;
    });
    renderDailyTasksTab();

    const taskDate = ordered[0]?.task_date || getLocalISODate();

    try {
        const updated = await reorderDailyTasks(taskDate, payloadItems);
        if (Array.isArray(updated) && updated.length > 0) {
            const byId = Object.fromEntries(updated.map(row => [row.id, row]));
            dailyTasks = dailyTasks.map(dt => byId[dt.id] || dt);
            renderDailyTasksTab();
        }
    } catch (err) {
        console.error(err);
        showToast("Não foi possível salvar a nova ordem. Recarregando...", "error");
        await loadDailyTasks();
    }
}

/**
 * Conclui uma tarefa diretamente pela linha da aba "Tarefas de Hoje" (sem
 * passar pelo modal). Uma única chamada ao backend - RPC complete_daily_task
 * sincroniza items.status na mesma transação.
 */
async function completeDailyTaskRow(dailyTask) {
    try {
        const updated = await completeDailyTask(dailyTask.id);
        dailyTasks = dailyTasks.map(dt => dt.id === updated.id ? updated : dt);
        todayMap[dailyTask.item_id] = updated;
        renderDailyTasksTab();
        showToast("Tarefa concluída!", "success");

        // Se o item também estiver visível na lista normal, atualiza o
        // status exibido ali (sem duplicar a lógica: apenas recarrega).
        if (typeof allTasks !== "undefined") {
            await loadTasks();
        }
    } catch (err) {
        console.error(err);
        showToast(err.message || "Não foi possível concluir a tarefa.", "error");
    }
}

/**
 * Cancela uma tarefa diretamente pela linha da aba "Tarefas de Hoje" (sem
 * passar pelo modal). Uma única chamada ao backend - RPC cancel_daily_task
 * sincroniza items.status na mesma transação.
 */
async function cancelDailyTaskRow(dailyTask) {
    if (!confirmDestructive("Tem certeza que deseja cancelar esta tarefa?")) return;

    try {
        const updated = await cancelDailyTask(dailyTask.id);
        dailyTasks = dailyTasks.map(dt => dt.id === updated.id ? updated : dt);
        todayMap[dailyTask.item_id] = updated;
        renderDailyTasksTab();
        showToast("Tarefa cancelada.", "success");

        if (typeof allTasks !== "undefined") {
            await loadTasks();
        }
    } catch (err) {
        console.error(err);
        showToast(err.message || "Não foi possível cancelar a tarefa.", "error");
    }
}

/**
 * Hook chamado por modal.js ao fechar o modal (closeModal). Mantém a aba
 * "Tarefas de Hoje" sincronizada caso o modal tenha sido usado para
 * concluir/cancelar uma tarefa que também está no dia atual - sem que
 * modal.js precise conhecer nada sobre daily_tasks.
 */
function onModalClosed() {
    if (isDailyTasksTabActive()) {
        loadDailyTasks();
    }
}
