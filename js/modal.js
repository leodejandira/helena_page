// modal.js
// Responsável SOMENTE pelo modal: abrir, fechar, preencher os dados da tarefa,
// salvar notas e exibir o status das dependências (leitura).
// NÃO decide a regra de conclusão (isso é de tasks.js/completeTask) e
// NÃO controla o timer diretamente (isso é de timer.js) - apenas dispara
// as chamadas apropriadas a partir dos eventos ligados em app.js.

function openModal(task) {
    activeTask = task;
    resetElapsedTime();

    document.getElementById("m-title").innerText = task.item;

    const grupoEl = document.getElementById("m-grupo-badge");
    grupoEl.textContent = task.grupo;
    grupoEl.className = "grupo-badge " + getGroupBadgeClass(task.grupo);

    document.getElementById("m-categoria").innerText = task.categoria || "-";
    document.getElementById("m-status").innerText = task.status;
    document.getElementById("m-criticidade").innerText = task.criticidade || "-";
    document.getElementById("m-complexidade").innerText = task.complexidade || "-";
    document.getElementById("m-prioridade").innerText = task.prioridade || "-";
    document.getElementById("m-custo").innerText = `R$ ${Number(task.custo || 0).toFixed(2)}`;
    document.getElementById("m-tempo-ext").innerText = `${Number(task.tempo_ext_h || 0).toFixed(2)} h`;
    document.getElementById("m-banco-tempo").innerText = Number(task.tempo_gasto_h || 0).toFixed(2);
    document.getElementById("m-deadline").innerText = task.data_limite || "-";
    document.getElementById("m-notas").value = task.notas || "";

    updateTimerDisplay();
    renderDependenciesSection(task);

    const isFinal = FINAL_STATUSES.includes(task.status);
    document.getElementById("modal-timer-section").style.display = isFinal ? "none" : "block";

    document.getElementById("timer-modal").classList.add("open");
}

/**
 * Busca e exibe o status de cada dependência da tarefa (somente leitura).
 * Não bloqueia nada aqui - a validação de bloqueio de conclusão acontece
 * em dependencies.js/checkDependencies, chamada pelo fluxo de conclusão
 * em tasks.js.
 */
async function renderDependenciesSection(task) {
    const container = document.getElementById("m-dependencies");
    if (!container) return;

    const deps = Array.isArray(task.dependencies) ? task.dependencies : [];

    if (deps.length === 0) {
        container.innerHTML = `<p class="modal-empty-line">Nenhuma dependência.</p>`;
        return;
    }

    container.innerHTML = `<p class="modal-empty-line">Verificando dependências...</p>`;

    try {
        const status = await getDependenciesStatus(task);

        // Evita sobrescrever se o modal já foi trocado para outra tarefa
        if (!activeTask || activeTask.id !== task.id) return;

        container.innerHTML = "";
        status.forEach(dep => {
            const line = document.createElement("div");
            let label, cls;

            if (dep.status === "concluida") {
                label = `✔ ${dep.nome}`;
                cls = "dep-ok";
            } else if (dep.status === "pendente") {
                label = `⏳ ${dep.nome}`;
                cls = "dep-pending";
            } else if (dep.status === "nao_encontrada") {
                label = `⚠ Tarefa #${dep.id} não encontrada`;
                cls = "dep-missing";
            } else {
                label = `⚠ Tarefa #${dep.id} (não foi possível verificar)`;
                cls = "dep-missing";
            }

            line.className = `dependency-line ${cls}`;
            line.textContent = label;
            container.appendChild(line);
        });
    } catch (err) {
        console.error("Erro ao carregar dependências", err);
        container.innerHTML = `<p class="modal-empty-line">Não foi possível verificar as dependências.</p>`;
    }
}

/**
 * Salva o texto de notas da tarefa aberta via PUT /items/{id}.
 */
async function saveNotes() {
    if (!activeTask) return;

    const textarea = document.getElementById("m-notas");
    const novoTexto = textarea.value;

    try {
        const atualizada = await updateTaskAPI(activeTask.id, { notas: novoTexto }, { silent: true });
        activeTask = atualizada || { ...activeTask, notas: novoTexto };
        showToast("Notas salvas!", "success");
    } catch (err) {
        console.error(err);
        showToast("Não foi possível salvar as notas. Tente novamente.", "error");
    }
}

function closeModal() {
    pauseTimer();
    document.getElementById("timer-modal").classList.remove("open");
    activeTask = null;

    // Ponto de extensão opcional: se definido (daily-tasks.js), permite
    // que outra parte da aplicação reaja ao fechamento do modal, sem que
    // modal.js precise conhecer nada sobre Tarefas de Hoje.
    if (typeof onModalClosed === "function") {
        onModalClosed();
    }
}
