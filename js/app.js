// app.js
// Responsável por: inicialização da aplicação e eventos globais.

function switchTab(index) {
    document.querySelectorAll(".tab").forEach((t, i) => t.classList.toggle("active", i === index));
    document.querySelectorAll(".tab-content").forEach((c, i) => c.classList.toggle("active", i === index));
    if (index === 0) loadTasks();
}

function initEventListeners() {
    // Abas
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

    // Timer / modal
    document.getElementById("btn-start").addEventListener("click", startTimer);
    document.getElementById("btn-pause").addEventListener("click", pauseTimer);
    document.getElementById("btn-interrupt").addEventListener("click", () => saveProgress(false));
    document.getElementById("btn-finish").addEventListener("click", () => saveProgress(true));
    document.getElementById("btn-cancel-modal").addEventListener("click", cancelActiveTaskFromModal);
    document.getElementById("btn-close-modal").addEventListener("click", closeModal);
}

function init() {
    populateFilterOptions();
    renderStatusFilterButtons();
    initEventListeners();
    loadTasks();
}

document.addEventListener("DOMContentLoaded", init);
