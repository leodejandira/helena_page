// nav.js
// Responsável SOMENTE por controle visual de navegação:
// abrir/fechar a sidebar e alternar qual "page" (section) está visível.
//
// NÃO é um roteador: não usa hash, não usa history.pushState, não gera
// URLs por página. É apenas um "trocador de sections" dentro da SPA,
// preparado para no futuro receber novas páginas/módulos.

function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebar-overlay").classList.add("visible");
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebar-overlay").classList.remove("visible");
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

/**
 * Alterna a section visível dentro de <main>, e o item ativo na sidebar.
 * @param {string} pageKey ex: "tasks", "dashboard", "projetos", "monitoramento", "configuracoes"
 */
function switchPage(pageKey) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle("active", section.id === `page-${pageKey}`);
    });

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.page === pageKey);
    });

    closeSidebar();

    // A página de Tasks é a única funcional hoje; ao voltar para ela,
    // atualiza a lista para refletir qualquer mudança feita enquanto o
    // usuário estava em outra section.
    if (pageKey === "tasks") {
        loadTasks();
    }
}

function initNav() {
    document.getElementById("btn-hamburger").addEventListener("click", toggleSidebar);
    document.getElementById("sidebar-overlay").addEventListener("click", closeSidebar);

    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => switchPage(item.dataset.page));
    });
}
