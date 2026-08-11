// app.js
// Responsável por: inicialização da aplicação e ligação dos eventos globais.

function switchTab(index) {
    document.querySelectorAll(".tab").forEach((t, i) => t.classList.toggle("active", i === index));
    document.querySelectorAll(".tab-content").forEach((c, i) => c.classList.toggle("active", i === index));
    if (index === 0) loadTasks();
    if (index === 2) loadDailyTasks();
}

function initEventListeners() {
    // Abas internas da página Tasks (Tarefas & Filtros / Nova Tarefa)
    document.querySelectorAll(".tab").forEach((tab, i) => {
        tab.addEventListener("click", () => switchTab(i));
    });

    // Formulário de cadastro
    document.getElementById("task-form").addEventListener("submit", handleCreateTask);

    // Filtros (grupo/categoria/complexidade/criticidade/custo/data)
    ["f-grupo", "f-categoria", "f-complex", "f-crit"].forEach(id => {
        document.getElementById(id).addEventListener("change", renderTable);
    });
    document.getElementById("f-custo-max").addEventListener("input", renderTable);
    document.getElementById("f-data-max").addEventListener("change", renderTable);

    // Timer (controle de tempo puro - timer.js)
    document.getElementById("btn-start").addEventListener("click", startTimer);
    document.getElementById("btn-pause").addEventListener("click", pauseTimer);
    document.getElementById("btn-interrupt").addEventListener("click", saveElapsedTime);

    // Conclusão da tarefa (regra de negócio - tasks.js/completeTask, que por
    // sua vez consulta dependencies.js antes de persistir)
    document.getElementById("btn-finish").addEventListener("click", () => completeTask(activeTask));

    // Cancelamento e fechamento do modal
    document.getElementById("btn-cancel-modal").addEventListener("click", cancelActiveTaskFromModal);
    document.getElementById("btn-close-modal").addEventListener("click", closeModal);
    document.getElementById("btn-close-modal-x").addEventListener("click", closeModal);

    // Notas
    document.getElementById("btn-save-notes").addEventListener("click", saveNotes);
}

function init() {
    initNav();
    populateFilterOptions();
    renderStatusFilterButtons();
    initEventListeners();
    loadTasks();
}

document.addEventListener("DOMContentLoaded", init);
