// timer.js
// Responsável SOMENTE pelo timer: iniciar, pausar, contar tempo, salvar progresso.
// Depende de: activeTask/elapsedSeconds/timerInterval (state.js), updateTaskAPI (tasks.js).

function updateTimerDisplay() {
    const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(elapsedSeconds % 60).padStart(2, "0");
    document.getElementById("m-timer").innerText = `${h}:${m}:${s}`;
}

/**
 * Inicia (ou retoma) a contagem do timer.
 * Se a tarefa ainda estiver "Preparada", muda automaticamente para "Em andamento"
 * e salva no backend.
 */
function startTimer() {
    if (timerInterval) return; // já está rodando
    if (!activeTask) return;

    if (activeTask.status === "Preparada") {
        activeTask.status = "Em andamento";
        document.getElementById("m-status").innerText = "Em andamento";
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
 * Salva o progresso acumulado no backend.
 * @param {boolean} isFinished se true, marca a tarefa como "Concluída"
 */
async function saveProgress(isFinished) {
    if (!activeTask) return;
    pauseTimer();

    const horasAdicionadas = elapsedSeconds / 3600;
    const novoTempoGasto = activeTask.tempo_gasto_h + horasAdicionadas;
    const novoStatus = isFinished ? "Concluída" : "Em andamento";

    const atualizada = await updateTaskAPI(activeTask.id, {
        tempo_gasto_h: novoTempoGasto,
        status: novoStatus
    });

    if (isFinished) {
        alert("Tarefa concluída com sucesso!");
        closeModal();
    } else {
        alert(`Tempo salvo! Total atualizado: ${novoTempoGasto.toFixed(2)}h`);
        activeTask = atualizada || { ...activeTask, tempo_gasto_h: novoTempoGasto, status: novoStatus };
        elapsedSeconds = 0;
        updateTimerDisplay();
        document.getElementById("m-banco-tempo").innerText = activeTask.tempo_gasto_h.toFixed(2);
    }
}
