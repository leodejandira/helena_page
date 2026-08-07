// modal.js
// Responsável por: abrir modal, fechar modal, preencher dados.
// Decide se mostra os controles de timer ou o painel somente-leitura,
// de acordo com o status da tarefa.

function openModal(task) {
    activeTask = task;
    elapsedSeconds = 0; // zera o contador local (visual) desta sessão

    document.getElementById("m-title").innerText = task.item;
    document.getElementById("m-status").innerText = task.status;
    document.getElementById("m-banco-tempo").innerText = Number(task.tempo_gasto_h || 0).toFixed(2);
    updateTimerDisplay();

    const isFinal = FINAL_STATUSES.includes(task.status);

    document.getElementById("modal-timer-section").style.display = isFinal ? "none" : "block";
    document.getElementById("modal-readonly-section").style.display = isFinal ? "block" : "none";

    if (isFinal) {
        fillReadonlyPanel(task);
    }

    document.getElementById("timer-modal").classList.add("open");
}

function fillReadonlyPanel(task) {
    const panel = document.getElementById("modal-readonly-section");
    panel.innerHTML = `
        <div class="readonly-panel">
            <p class="modal-info-line"><strong>Grupo:</strong> ${task.grupo}</p>
            <p class="modal-info-line"><strong>Categoria:</strong> ${task.categoria}</p>
            <p class="modal-info-line"><strong>Complexidade:</strong> ${task.complexidade || "-"}</p>
            <p class="modal-info-line"><strong>Criticidade:</strong> ${task.criticidade || "-"}</p>
            <p class="modal-info-line"><strong>Custo:</strong> R$ ${Number(task.custo || 0).toFixed(2)}</p>
            <p class="modal-info-line"><strong>Tempo estimado:</strong> ${Number(task.tempo_ext_h || 0).toFixed(2)} h</p>
            <p class="modal-info-line"><strong>Tempo gasto:</strong> ${Number(task.tempo_gasto_h || 0).toFixed(2)} h</p>
            <p class="modal-info-line"><strong>Data limite:</strong> ${task.data_limite || "-"}</p>
        </div>
    `;
}

function closeModal() {
    pauseTimer();
    document.getElementById("timer-modal").classList.remove("open");
    activeTask = null;
}
