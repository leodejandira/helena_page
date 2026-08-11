// daily-tasks-api.js
// Responsável SOMENTE pela comunicação com o backend para o recurso
// daily-tasks (Tarefas de Hoje). Mesmo padrão de api.js, isolado em módulo
// próprio para não misturar responsabilidades com o CRUD de items.

const DAILY_TASKS_API_URL = "https://ms-helena-tasks-manager.onrender.com/daily-tasks";

/**
 * Busca as tarefas planejadas para uma data.
 * @param {string} [date] formato YYYY-MM-DD. Se omitido, o backend assume
 *   "hoje" em America/Sao_Paulo.
 * @returns {Promise<Array>} registros de daily_tasks (não os items completos)
 */
async function fetchDailyTasks(date) {
    const url = date
        ? `${DAILY_TASKS_API_URL}/?date=${encodeURIComponent(date)}`
        : `${DAILY_TASKS_API_URL}/`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erro ao buscar tarefas de hoje: ${response.status}`);
    }
    return response.json();
}

/**
 * Adiciona uma tarefa às tarefas de um dia (por padrão, hoje).
 * @param {number} itemId
 * @param {string} [date] formato YYYY-MM-DD
 * @returns {Promise<Object>} registro de daily_tasks criado
 */
async function createDailyTask(itemId, date) {
    const payload = { item_id: itemId };
    if (date) payload.task_date = date;

    const response = await fetch(DAILY_TASKS_API_URL + "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || `Erro ao adicionar tarefa de hoje: ${response.status}`);
    }
    return response.json();
}

/**
 * Remove a associação da tarefa com o dia. NÃO exclui a tarefa original
 * em `items` - isso é feito pelo backend, mas reforçamos aqui na doc para
 * deixar claro o contrato desta função.
 * @param {number} dailyTaskId
 */
async function deleteDailyTask(dailyTaskId) {
    const response = await fetch(`${DAILY_TASKS_API_URL}/${dailyTaskId}`, {
        method: "DELETE"
    });
    if (!response.ok && response.status !== 204) {
        throw new Error(`Erro ao remover tarefa de hoje: ${response.status}`);
    }
}

/**
 * Persiste a nova ordem das tarefas de um dia em uma única requisição.
 * @param {string} taskDate formato YYYY-MM-DD
 * @param {Array<{id:number, order_index:number}>} items
 * @returns {Promise<Array>}
 */
async function reorderDailyTasks(taskDate, items) {
    const response = await fetch(`${DAILY_TASKS_API_URL}/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_date: taskDate, items })
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || `Erro ao reordenar tarefas de hoje: ${response.status}`);
    }
    return response.json();
}

/**
 * Conclui uma tarefa de hoje. Uma única chamada é suficiente: o backend
 * (RPC complete_daily_task) sincroniza daily_tasks e items.status na mesma
 * transação do Postgres.
 * @param {number} dailyTaskId
 * @returns {Promise<Object>} registro de daily_tasks atualizado
 */
async function completeDailyTask(dailyTaskId) {
    const response = await fetch(`${DAILY_TASKS_API_URL}/${dailyTaskId}/complete`, {
        method: "PATCH"
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || `Erro ao concluir tarefa de hoje: ${response.status}`);
    }
    return response.json();
}

/**
 * Cancela uma tarefa de hoje. Uma única chamada é suficiente: o backend
 * (RPC cancel_daily_task) sincroniza daily_tasks e items.status na mesma
 * transação do Postgres.
 * @param {number} dailyTaskId
 * @returns {Promise<Object>} registro de daily_tasks atualizado
 */
async function cancelDailyTask(dailyTaskId) {
    const response = await fetch(`${DAILY_TASKS_API_URL}/${dailyTaskId}/cancel`, {
        method: "PATCH"
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || `Erro ao cancelar tarefa de hoje: ${response.status}`);
    }
    return response.json();
}
