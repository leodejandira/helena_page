// ui.js
// Responsável SOMENTE por feedback visual genérico: toasts e confirmações.
// Não conhece tarefas, não conhece API, não decide regra de negócio.
// Objetivo: evitar alert()/confirm() espalhados pelo projeto.

/**
 * Exibe uma mensagem temporária (toast) no canto da tela.
 * @param {string} message
 * @param {"info"|"success"|"warning"|"error"} type
 * @param {number} duration ms visível antes de sumir
 */
function showToast(message, type = "info", duration = 4000) {
    const container = getOrCreateToastContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // força reflow para a transição de entrada funcionar
    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function getOrCreateToastContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Confirmação amigável para ações destrutivas (ex: cancelar tarefa).
 * Centralizado aqui para não espalhar confirm() pelo projeto; permite
 * evoluir futuramente para um modal customizado sem tocar em outros módulos.
 * @param {string} message
 * @returns {boolean}
 */
function confirmDestructive(message) {
    return window.confirm(message);
}
