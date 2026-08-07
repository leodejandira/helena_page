// api.js
// Responsável SOMENTE pela comunicação com o backend.
// Não conhece DOM, não conhece estado global, não decide regra de negócio.

const API_URL = "https://ms-helena-tasks-manager.onrender.com/items";

/**
 * Busca todas as tarefas no backend.
 * @returns {Promise<Array>} lista de tarefas
 */
async function fetchTasks() {
    const response = await fetch(API_URL + "/");
    if (!response.ok) {
        throw new Error(`Erro ao buscar tarefas: ${response.status}`);
    }
    return response.json();
}

/**
 * Cria uma nova tarefa.
 * @param {Object} payload dados da tarefa (sem id)
 * @returns {Promise<Object>} tarefa criada
 */
async function createTask(payload) {
    const response = await fetch(API_URL + "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        throw new Error(`Erro ao criar tarefa: ${response.status}`);
    }
    return response.json();
}

/**
 * Atualiza uma tarefa existente (parcial ou total).
 * @param {number} id id da tarefa
 * @param {Object} payload campos a atualizar
 * @returns {Promise<Object>} tarefa atualizada
 */
async function updateTask(id, payload) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        throw new Error(`Erro ao atualizar tarefa ${id}: ${response.status}`);
    }
    return response.json();
}
