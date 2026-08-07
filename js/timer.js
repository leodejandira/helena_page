// timer.js
// Responsável SOMENTE pelo controle de tempo: iniciar, pausar, contar,
// exibir e persistir o tempo decorrido.
// Este módulo NÃO decide status "Concluída" e NÃO conhece regra de negócio
// de tarefa (isso é responsabilidade de tasks.js / dependencies.js).
// Depende de: activeTask/elapsedSeconds/timerInterval (state.js),
// updateTaskAPI (tasks.js), showToast (ui.js).

function updateTimerDisplay() {
    const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(elapsedSeconds % 60).padStart(2, "0");
    const el = document.getElementById("m-timer");
    if (el) el.innerText = `${h}:${m}:${s}`;
}

/**
 * Inicia (ou retoma) a contagem do timer.
 * Se a tarefa ainda estiver "Preparada", muda automaticamente para "Em andamento"
 * e salva no backend (transição de estado simples, não é a regra de conclusão).
 */
function startTimer() {
    if (timerInterval) return; // já está rodando
    if (!activeTask) return;

    if (activeTask.status === "Preparada") {
        activeTask.status = "Em andamento";
        const statusEl = document.getElementById("m-status");
        if (statusEl) statusEl.innerText = "Em andamento";
        updateTaskAPI(activeTask.id, { status: "Em andamento" }, { silent: true });
    }

    timerInterval = setInterval(() => {
        elapsedSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

/**
 * Retorna o tempo decorrido na sessão atual, em horas.
 * Puro cálculo - não persiste nada.
 * @returns {number}
 */
function getElapsedHours() {
    return elapsedSeconds / 3600;
}

/**
 * Zera o contador local (visual) da sessão atual.
 */
function resetElapsedTime() {
    elapsedSeconds = 0;
    updateTimerDisplay();
}

/**
 * Persiste o tempo acumulado da sessão atual no backend, SEM alterar o
 * status da tarefa para um estado final. Usado pela ação
 * "Interromper Momentaneamente (Salva Tempo)".
 */
async function saveElapsedTime() {
    if (!activeTask) return;
    pauseTimer();

    const horasAdicionadas = getElapsedHours();
    const novoTempoGasto = (activeTask.tempo_gasto_h || 0) + horasAdicionadas;

    try {
        const atualizada = await updateTaskAPI(activeTask.id, {
            tempo_gasto_h: novoTempoGasto
        });

        activeTask = atualizada || { ...activeTask, tempo_gasto_h: novoTempoGasto };
        resetElapsedTime();

        const bancoEl = document.getElementById("m-banco-tempo");
        if (bancoEl) bancoEl.innerText = Number(activeTask.tempo_gasto_h).toFixed(2);

        showToast(`Tempo salvo! Total atualizado: ${Number(activeTask.tempo_gasto_h).toFixed(2)}h`, "success");
    } catch (err) {
        console.error(err);
        showToast("Não foi possível salvar o tempo. Tente novamente.", "error");
    }
}
