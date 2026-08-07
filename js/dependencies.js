// dependencies.js
// Responsável SOMENTE pela regra de negócio de dependências entre tarefas.
// Não conhece timer, não conhece modal/DOM, não decide UI - apenas consulta
// o backend e retorna resultados estruturados para quem chamar decidir o que fazer.
//
// Postura totalmente defensiva:
// - task.dependencies null / undefined / [] => sem bloqueio.
// - Nunca assume que um id referenciado em "dependencies" existe no backend.
// - Falha de rede ou 404 ao consultar uma dependência é reportada, não ignorada
//   silenciosamente e não trava a aplicação inteira.

/**
 * Consulta o status de cada dependência de uma tarefa, sem decidir se bloqueia ou não.
 * Útil para exibição (ex: lista de dependências dentro do modal).
 *
 * @param {Object} task tarefa que pode ter (ou não) um array `dependencies`
 * @returns {Promise<Array<{id:number, nome:string|null, status:"concluida"|"pendente"|"nao_encontrada"|"erro"}>>}
 */
async function getDependenciesStatus(task) {
    const deps = Array.isArray(task?.dependencies) ? task.dependencies : [];

    if (deps.length === 0) {
        return [];
    }

    return Promise.all(
        deps.map(async (depId) => {
            try {
                const depTask = await fetchTaskById(depId);

                if (!depTask) {
                    return { id: depId, nome: null, status: "nao_encontrada" };
                }

                return {
                    id: depId,
                    nome: depTask.item || `Tarefa #${depId}`,
                    status: depTask.status === "Concluída" ? "concluida" : "pendente"
                };
            } catch (err) {
                // Dependência não encontrada (404) ou erro de rede: não travamos a
                // aplicação, apenas reportamos claramente que não foi possível confirmar.
                console.error(`Não foi possível verificar a dependência #${depId}`, err);
                return { id: depId, nome: null, status: "erro" };
            }
        })
    );
}

/**
 * Verifica se uma tarefa PODE ser concluída, considerando suas dependências.
 * - Sem dependências (null/undefined/[]) => sempre ok.
 * - Qualquer dependência não concluída, não encontrada, ou com erro de
 *   consulta é tratada como bloqueio (postura conservadora e transparente).
 *
 * @param {Object} task
 * @returns {Promise<{ok: boolean, bloqueios: Array}>}
 */
async function checkDependencies(task) {
    const status = await getDependenciesStatus(task);
    const bloqueios = status.filter(s => s.status !== "concluida");
    return { ok: bloqueios.length === 0, bloqueios };
}

/**
 * Monta uma mensagem amigável e legível a partir de uma lista de bloqueios.
 * Não manipula DOM - apenas retorna texto pronto para quem for exibir (toast, etc).
 * @param {Array} bloqueios resultado de checkDependencies().bloqueios
 * @returns {string}
 */
function formatDependencyBlockMessage(bloqueios) {
    if (!bloqueios || bloqueios.length === 0) return "";

    const linhas = bloqueios.map(b => {
        if (b.status === "pendente") return `• ${b.nome} (ainda não concluída)`;
        if (b.status === "nao_encontrada") return `• Tarefa #${b.id} (não encontrada)`;
        if (b.status === "erro") return `• Tarefa #${b.id} (não foi possível verificar)`;
        return `• Tarefa #${b.id}`;
    });

    return `Essa tarefa depende da conclusão de:\n${linhas.join("\n")}`;
}
