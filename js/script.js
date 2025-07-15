document.addEventListener("DOMContentLoaded", async () => {
  // --- ELEMENTOS DO DOM ---
  const menuToggle = document.getElementById("menu-toggle");
  const menuOverlay = document.getElementById("menu-overlay");
  const body = document.body;
  const logoutBtn = document.getElementById("logout-btn");
  const loginSection = document.getElementById("login-section");
  const mainSystem = document.getElementById("main-system");
  const loginForm = document.getElementById("login-form");
  const agendamentosTitle = document.getElementById("agendamentos-title");
  const showAllAgendamentosBtn = document.getElementById(
    "show-all-agendamentos-btn"
  );
  const animalSearchBtn = document.getElementById("animal-search-btn");
  const animalSearchInput = document.getElementById("animal-search-input");
  const animalClearSearchBtn = document.getElementById(
    "animal-clear-search-btn"
  );

  // --- FUNÇÃO DE CONTROLE DE ACESSO (VERSÃO CORRETA E SIMPLES) ---
  const checkAdminAccess = () => {
    const session = api.getSession();
    // Adiciona ou remove a classe 'is-admin' do body. O CSS faz o resto.
    document.body.classList.toggle("is-admin", session.isAdmin());
  };

  // --- LÓGICA DE INICIALIZAÇÃO E SESSÃO ---
  const initializeApp = async () => {
    const hasSession = await api.checkAndLoadSession();
    if (hasSession) {
      loginSection.style.display = "none";
      mainSystem.style.display = "block";
      checkAdminAccess(); // Verifica permissões assim que a sessão é carregada
      await renderAll();
    } else {
      loginSection.style.display = "flex";
      mainSystem.style.display = "none";
    }
  };

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = loginForm.querySelector('button[type="submit"]');
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    saveBtn.disabled = true;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const result = await api.login(username, password);

    if (result.success) {
      await initializeApp(); // Reutiliza a rotina de inicialização
    } else {
      alert(result.message || "Falha no login.");
    }
    saveBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    saveBtn.disabled = false;
  });

  // --- LÓGICA DE NAVEGAÇÃO E MODAIS ---
  const closeMenu = () => body.classList.remove("menu-open");
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    body.classList.toggle("menu-open");
  });
  menuOverlay.addEventListener("click", closeMenu);

  document.querySelectorAll(".sidebar-menu a").forEach((link) => {
    if (link.id !== "logout-btn") {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        closeMenu();
        navigateToSection(e.currentTarget.getAttribute("data-section"));
      });
    }
  });

  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (confirm("Tem certeza que deseja sair?")) {
      await api.logout();
      window.location.reload();
    }
  });

  const navigateToSection = (sectionId) => {
    document
      .querySelectorAll(".menu-link")
      .forEach((el) => el.classList.remove("active"));
    const linkToActivate = document.querySelector(
      `.menu-link[data-section="${sectionId}"]`
    );
    if (linkToActivate) linkToActivate.classList.add("active");

    document
      .querySelectorAll(".section")
      .forEach((sec) => sec.classList.remove("active"));
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) sectionToShow.classList.add("active");
  };

  const openModal = (modalId) =>
    document.getElementById(modalId)?.classList.add("active");
  const closeModal = (modal) => modal?.classList.remove("active");

  document.querySelectorAll(".open-modal").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const modalId = e.currentTarget.dataset.modal;
      // Reseta o formulário de usuário sempre que o modal de criação é aberto
      if (modalId === "user-modal") {
        document.getElementById("user-modal-title").textContent =
          "Novo Usuário";
        const form = document.getElementById("user-form");
        form.reset();
        form.querySelector("#user-id").value = "";
        form.querySelector("#user-email").disabled = false;
        document.getElementById("password-group").style.display = "block";
      }
      openModal(modalId);
    })
  );

  document
    .querySelectorAll(".close-modal")
    .forEach((btn) =>
      btn.addEventListener("click", () => closeModal(btn.closest(".modal")))
    );
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) closeModal(e.target);
  });

  // --- LÓGICA DE BUSCA ---
  animalSearchBtn.addEventListener("click", async () => {
    const searchTerm = animalSearchInput.value.trim();
    if (searchTerm) {
      await renderAnimaisView({ search: searchTerm });
      animalClearSearchBtn.style.display = "inline-flex";
    }
  });

  animalClearSearchBtn.addEventListener("click", async () => {
    animalSearchInput.value = "";
    animalClearSearchBtn.style.display = "none";
    await renderAnimaisView();
  });

  // --- RENDERIZAÇÃO ---
  const renderAll = async () => {
    await Promise.all([
      renderAnimaisView(),
      renderServicosCards(),
      renderAgendamentosView(),
      renderDashboardStats(),
      renderCalendar(),
      populateAgendamentoFormSelects(),
      renderUsersView(),
    ]);
    await showAppointmentsForDay(new Date().toISOString().slice(0, 10));
  };

 const renderAnimaisView = async (searchParams = {}) => {
    const animais = await api.getAnimais(searchParams);
    const container = document.getElementById('animais-view-container');
    container.innerHTML = '';
    if (!Array.isArray(animais)) return;
    animais.forEach(animal => {
        const card = document.createElement('div');
        card.className = 'data-card animal-card';
        card.innerHTML = `
            <div class="data-card-header"><div><div class="title">${animal.nome}</div><div class="subtitle">${animal.raca} (${animal.especie})</div></div></div>
            <div class="data-card-body"><strong>Tutor: </strong><span>${animal.tutor}</span></div>

            <span class="desktop-view">${animal.nome}</span>
            <span class="desktop-view">${animal.especie}</span> <span class="desktop-view">${animal.tutor}</span>
            <span class="desktop-view">${animal.raca}</span>

            <div class="data-card-actions">
                <button title="Editar" class="btn-edit action-btn"><i class="fas fa-edit"></i></button>
                <button title="Excluir" class="btn-delete action-btn"><i class="fas fa-trash"></i></button>
            </div>`;
        card.querySelector('.btn-edit').addEventListener('click', () => editAnimal(animal.id));
        card.querySelector('.btn-delete').addEventListener('click', () => deleteAnimal(animal.id));
        container.appendChild(card);
    });
};

  const renderServicosCards = async () => {
    const servicos = await api.getServicos();
    const grid = document.getElementById("servicos-card-grid");
    grid.innerHTML = "";
    if (!Array.isArray(servicos)) return;
    servicos.forEach((servico) => {
      grid.innerHTML += `
              <div class="card">
                  <div class="card-header"><h3>${servico.nome}</h3></div>
                  <div class="card-body">
                      <p><strong>Preço:</strong> R$ ${Number(
                        servico.preco
                      ).toFixed(2)}</p>
                      <p><strong>Duração:</strong> ${
                        servico.duracao
                      } minutos</p>
                      <p><strong>Descrição:</strong> ${
                        servico.descricao || "Nenhuma."
                      }</p>
                  </div>
                  <div class="card-footer">
                      <button class="btn btn-edit" onclick="editServico('${
                        servico.id
                      }')"><i class="fas fa-edit"></i> Editar</button>
                      <button class="btn btn-delete" onclick="deleteServico('${
                        servico.id
                      }')"><i class="fas fa-trash"></i> Excluir</button>
                  </div>`;
    });
  };

  const renderAgendamentosView = async (dateFilter = null) => {
    let agendamentos = await api.getAgendamentos();
    const animais = await api.getAnimais();
    const servicos = await api.getServicos();
    const container = document.getElementById("agendamentos-view-container");
    container.innerHTML = "";
    if (
      !Array.isArray(agendamentos) ||
      !Array.isArray(animais) ||
      !Array.isArray(servicos)
    )
      return;
    if (dateFilter) {
      agendamentos = agendamentos.filter((ag) => ag.data === dateFilter);
      agendamentosTitle.textContent = `Agenda de ${new Date(
        `${dateFilter}T12:00:00`
      ).toLocaleDateString("pt-BR")}`;
      showAllAgendamentosBtn.style.display = "inline-flex";
    } else {
      agendamentosTitle.textContent = "Todos os Agendamentos";
      showAllAgendamentosBtn.style.display = "none";
    }
    agendamentos.sort(
      (a, b) =>
        new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`)
    );
    agendamentos.forEach((ag) => {
      const animal = animais.find((a) => a.id == ag.animalId);
      const servico = servicos.find((s) => s.id == ag.servicoId);
      const dataHora = new Date(`${ag.data}T${ag.hora}`);
      const card = document.createElement("div");
      card.className = "data-card agendamento-card";
      card.innerHTML = `
              <div class="data-card-header">
                  <div><div class="title">${
                    animal?.nome || "N/A"
                  }</div><div class="subtitle">${dataHora.toLocaleString(
        "pt-BR",
        { dateStyle: "short", timeStyle: "short" }
      )}</div></div>
              </div>
              <div class="data-card-body">
                  <span><strong>Serviço: </strong> ${
                    servico?.nome || "N/A"
                  }</span>
                  <span><strong>Tutor: </strong> ${
                    animal?.tutor || "N/A"
                  }</span>
              </div>
              <span class="desktop-view">${dataHora.toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}</span>
              <span class="desktop-view">${animal?.nome || "N/A"}</span>
              <span class="desktop-view">${animal?.tutor || "N/A"}</span>
              <span class="desktop-view">${servico?.nome || "N/A"}</span>
              <span class="desktop-view"><span class="badge badge-${
                ag.status
              }">${ag.status}</span></span>
              <div class="data-card-actions">
                  <button title="Editar" class="btn-edit action-btn"><i class="fas fa-edit"></i></button>
                  <button title="Excluir" class="btn-delete action-btn"><i class="fas fa-trash"></i></button>
              </div>`;
      card
        .querySelector(".btn-edit")
        .addEventListener("click", () => editAgendamento(ag.id));
      card
        .querySelector(".btn-delete")
        .addEventListener("click", () => deleteAgendamento(ag.id));
      container.appendChild(card);
    });
  };

  const renderUsersView = async () => {
    const users = await api.getUsers();
    const container = document.getElementById("users-view-container");
    container.innerHTML = "";
    if (!Array.isArray(users)) return;
    users.forEach((user) => {
      const card = document.createElement("div");
      card.className = "data-card user-card";
      card.innerHTML = `
            <div class="data-card-header"><div class="title">${
              user.name || "(Sem nome)"
            }</div><div class="subtitle">${user.email}</div></div>
            <div class="data-card-body"><strong>Função: </strong><span>${
              user.funcao
            }</span></div>
            <span class="desktop-view">${user.name || "(Sem nome)"}</span>
            <span class="desktop-view">${user.email}</span>
            <span class="desktop-view">${user.funcao}</span>
            <span class="desktop-view">${user.isAdmin ? "Sim" : "Não"}</span>
            <div class="data-card-actions">
                <button title="Editar" class="btn-edit action-btn"><i class="fas fa-edit"></i></button>
                <button title="Excluir" class="btn-delete action-btn" ${
                  user.Username.toLowerCase() === "admin" ? "disabled" : ""
                }><i class="fas fa-trash"></i></button>
            </div>`;
      card
        .querySelector(".btn-edit")
        .addEventListener("click", () => editUser(user));
      if (user.Username.toLowerCase() !== "admin") {
        card
          .querySelector(".btn-delete")
          .addEventListener("click", () => deleteUser(user.Username));
      }
      container.appendChild(card);
    });
  };

  const renderDashboardStats = async () => {
    const animais = await api.getAnimais();
    const agendamentos = await api.getAgendamentos();
    const servicos = await api.getServicos();
    const stats = {
      animais: Array.isArray(animais) ? animais.length : 0,
      agendamentosHoje: Array.isArray(agendamentos)
        ? agendamentos.filter(
            (a) => a.data === new Date().toISOString().slice(0, 10)
          ).length
        : 0,
      servicos: Array.isArray(servicos) ? servicos.length : 0,
      clientes: Array.isArray(animais)
        ? new Set(animais.map((a) => a.tutor)).size
        : 0,
    };
    document.getElementById("dashboard-stats").innerHTML = `
          <div class="stat-card"><div class="stat-icon" style="background: var(--primary);"><i class="fas fa-dog"></i></div><div class="stat-info"><h3>${stats.animais}</h3><p>Animais</p></div></div>
          <div class="stat-card"><div class="stat-icon" style="background: var(--success);"><i class="fas fa-calendar-check"></i></div><div class="stat-info"><h3>${stats.agendamentosHoje}</h3><p>Agenda Hoje</p></div></div>
          <div class="stat-card"><div class="stat-icon" style="background: var(--info);"><i class="fas fa-concierge-bell"></i></div><div class="stat-info"><h3>${stats.servicos}</h3><p>Serviços</p></div></div>
          <div class="stat-card"><div class="stat-icon" style="background: var(--accent);"><i class="fas fa-users"></i></div><div class="stat-info"><h3>${stats.clientes}</h3><p>Clientes</p></div></div>`;
  };

  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  const renderCalendar = async () => {
    const agendamentos = await api.getAgendamentos();
    const date = new Date(currentYear, currentMonth, 1);
    const monthName = date.toLocaleString("pt-BR", { month: "long" });
    let header = `<div class="calendar-header"><button class="btn btn-secondary" id="prev-month"><i class="fas fa-chevron-left"></i></button><h3>${
      monthName.charAt(0).toUpperCase() + monthName.slice(1)
    } ${currentYear}</h3><button class="btn btn-secondary" id="next-month"><i class="fas fa-chevron-right"></i></button></div>`;
    let grid = `<div class="calendar-grid">${[
      "Dom",
      "Seg",
      "Ter",
      "Qua",
      "Qui",
      "Sex",
      "Sáb",
    ]
      .map((d) => `<div class="calendar-day-header">${d}</div>`)
      .join("")}`;
    const firstDay = date.getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) {
      grid += `<div class="calendar-day other-month"></div>`;
    }
    for (let i = 1; i <= lastDate; i++) {
      const dayDateStr = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(i).padStart(2, "0")}`;
      const dayEvents = Array.isArray(agendamentos)
        ? agendamentos.filter((a) => a.data === dayDateStr)
        : [];
      grid += `<div class="calendar-day" data-date="${dayDateStr}"><div class="day-number">${i}</div>${
        dayEvents.length > 0
          ? `<div class="event-indicator">${dayEvents.length}</div>`
          : ""
      }</div>`;
    }
    document.getElementById("calendar-container").innerHTML =
      header + grid + "</div>";
    document.getElementById("prev-month").onclick = () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    };
    document.getElementById("next-month").onclick = () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    };
    document
      .querySelectorAll(".calendar-day:not(.other-month)")
      .forEach((day) =>
        day.addEventListener("click", () =>
          showAppointmentsForDay(day.dataset.date)
        )
      );
  };

  const showAppointmentsForDay = async (date) => {
    const agendamentos = await api.getAgendamentos();
    const animais = await api.getAnimais();
    const servicos = await api.getServicos();
    document.getElementById(
      "daily-appointments-title"
    ).textContent = `Agenda de ${new Date(
      `${date}T12:00:00`
    ).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })}`;
    const list = document.getElementById("daily-appointments-list");
    list.innerHTML = "<li>Nenhum agendamento para este dia.</li>";
    if (!Array.isArray(agendamentos)) return;
    const dailyAgendamentos = agendamentos
      .filter((ag) => ag.data === date)
      .sort((a, b) => a.hora.localeCompare(b.hora));
    if (dailyAgendamentos.length > 0) list.innerHTML = "";
    dailyAgendamentos.forEach((ag) => {
      const animal = animais.find((a) => a.id == ag.animalId);
      const servico = servicos.find((s) => s.id == ag.servicoId);
      const li = document.createElement("li");
      li.innerHTML = `
    <div class="appointment-icon">
        <i class="fas fa-paw"></i>
    </div>
    <div class="appointment-info">
        <div class="time">${ag.hora}</div>
        <div class="pet-name">${animal ? animal.nome : "Pet não encontrado"} (${
        servico ? servico.nome : "Serviço não encontrado"
      })</div>
    </div>
    <div class="appointment-status">
        <span class="badge badge-${ag.status}">${ag.status}</span>
    </div>
`;
      li.addEventListener("click", () => showAppointmentDetails(ag.id));
      list.appendChild(li);
    });
  };

  const showAppointmentDetails = async (id) => {
    const agendamentos = await api.getAgendamentos();
    const agendamento = agendamentos.find((a) => a.id === id);
    if (!agendamento) {
      alert("Agendamento não encontrado!");
      return;
    }

    const animais = await api.getAnimais();
    const animal = animais.find((a) => a.id === agendamento.animalId);
    const servicos = await api.getServicos();
    const servico = servicos.find((s) => s.id === agendamento.servicoId);

    const detailsBody = document.getElementById("appointment-details-body");
    // ... Detalhes do modal
    detailsBody.innerHTML = `
    <div class="details-header">
        <h4><i class="fas fa-calendar-alt"></i> ${new Date(
          `${agendamento.data}T${agendamento.hora}`
        ).toLocaleString("pt-BR", {
          dateStyle: "full",
          timeStyle: "short",
        })}</h4>
        <span class="badge badge-${agendamento.status}">${
      agendamento.status
    }</span>
    </div>
    <hr>
    <h5><i class="fas fa-dog"></i> Pet:</strong> ${animal?.especie || "N/A"}</h5>
    <p><strong>Nome:</strong> ${animal?.nome || "N/A"}</p>
    <p><strong>Tutor:</strong> ${animal?.tutor || "N/A"} (${
      animal?.telefone || "N/A"
    })</p>
    <p><strong>Observações:</strong> ${animal?.obs || "Nenhuma"}</p>
    <hr>
    <h5><i class="fas fa-concierge-bell"></i> Serviço</h5>
    <p><strong>Nome:</strong> ${servico?.nome || "N/A"}</p>
    <p><strong>Preço:</strong> R$ ${Number(servico?.preco || 0).toFixed(2)}</p>
    <p><strong>Duração:</strong> ${servico?.duracao || "N/A"} minutos</p>
`;
    // ...

    // --- LÓGICA DOS NOVOS BOTÕES ---
    const modal = document.getElementById("appointment-details-modal");
    const confirmBtn = modal.querySelector("#details-confirm-btn");
    const completeBtn = modal.querySelector("#details-complete-btn");

    // Clona os botões para remover event listeners antigos e evitar bugs de múltiplos cliques
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCompleteBtn = completeBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    completeBtn.parentNode.replaceChild(newCompleteBtn, completeBtn);

    // Controla a visibilidade e o estado dos botões
    if (agendamento.status === "Agendado") {
      newConfirmBtn.style.display = "inline-flex";
      newCompleteBtn.style.display = "inline-flex";
      newCompleteBtn.disabled = true;
      newCompleteBtn.title = "Confirme o agendamento para habilitar";
    } else if (agendamento.status === "Confirmado") {
      newConfirmBtn.style.display = "none";
      newCompleteBtn.style.display = "inline-flex";
      newCompleteBtn.disabled = false;
      newCompleteBtn.title = "Marcar como concluído";
    } else {
      // 'Cancelado' ou 'Concluido'
      newConfirmBtn.style.display = "none";
      newCompleteBtn.style.display = "none";
    }

    const updateStatus = async (newStatus) => {
      // Cria uma cópia do objeto para não modificar o original diretamente na lista
      const updatedAgendamento = { ...agendamento, status: newStatus };
      await api.saveAgendamento(updatedAgendamento);
      closeModal(modal);
      await renderAll();
    };

    // Adiciona o evento de clique para CONFIRMAR
    newConfirmBtn.addEventListener("click", () => updateStatus("Confirmado"));

    // Adiciona o evento de clique para CONCLUIR
    newCompleteBtn.addEventListener("click", () => updateStatus("Concluido"));

    openModal("appointment-details-modal");
  };

  showAllAgendamentosBtn.addEventListener("click", () => {
    renderAgendamentosView();
  });
  const populateAgendamentoFormSelects = async () => {
    const animais = await api.getAnimais();
    const servicos = await api.getServicos();
    const animalSelect = document.getElementById("agendamento-animal-id");
    const servicoSelect = document.getElementById("agendamento-servico-id");
    animalSelect.innerHTML = '<option value="">Selecione...</option>';
    servicoSelect.innerHTML = '<option value="">Selecione...</option>';
    if (Array.isArray(animais)) {
      animais.forEach(
        (a) =>
          (animalSelect.innerHTML += `<option value="${a.id}">${a.nome} (${a.tutor})</option>`)
      );
    }
    if (Array.isArray(servicos)) {
      servicos.forEach(
        (s) =>
          (servicoSelect.innerHTML += `<option value="${s.id}">${s.nome}</option>`)
      );
    }
  };

  const renderReport = () => {
    /* Vazio por enquanto */
  };

  // --- LÓGICA CRUD (INTERAÇÃO COM O USUÁRIO) ---
document.getElementById('save-animal-btn').addEventListener('click', async () => {
    const form = document.getElementById('animal-form');
    // Validação simples para garantir que os campos obrigatórios foram preenchidos
    if (!form.checkValidity()) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        form.reportValidity(); // Mostra ao usuário quais campos faltam
        return;
    }
    const data = {
        id: form['animal-id'].value || null,
        nome: form['animal-name'].value,
        raca: form['animal-breed'].value,
        tutor: form['tutor-name'].value,
        telefone: form['tutor-phone'].value,
        endereco: form['tutor-address'].value,
        cor: form['fur-color'].value,
        pelo: form['fur-type'].value,
        idade: form['animal-age'].value,
        peso: form['animal-weight'].value,
        alergias: form['animal-allergies'].value,
        obs: form['animal-notes'].value,
        // --- CAMPOS CORRIGIDOS ---
        // Usamos querySelector para buscar IDs que contêm hífens, é mais seguro.
        especie: form.querySelector('#species-type').value,
        sexo: form.querySelector('#sex-type').value
    };
    await api.saveAnimal(data);
    form.reset();
    closeModal(document.getElementById('animal-modal'));
    // Atualiza a visualização de animais e os formulários que dependem dela
    await renderAnimaisView();
    await populateAgendamentoFormSelects();
});

  document
    .getElementById("save-servico-btn")
    .addEventListener("click", async () => {
      const form = document.getElementById("servico-form");
      const data = {
        id: form["servico-id"].value || null,
        nome: form["servico-nome"].value,
        preco: form["servico-preco"].value,
        duracao: form["servico-duracao"].value,
        descricao: form["servico-descricao"].value,
      };
      await api.saveServico(data);
      form.reset();
      closeModal(document.getElementById("servico-modal"));
      await renderServicosCards();
    });

  document
    .getElementById("save-agendamento-btn")
    .addEventListener("click", async () => {
      const form = document.getElementById("agendamento-form");
      const data = {
        id: form["agendamento-id"].value || null,
        animalId: form["agendamento-animal-id"].value,
        servicoId: form["agendamento-servico-id"].value,
        data: form["agendamento-data"].value,
        hora: form["agendamento-hora"].value,
        status: form["agendamento-status"].value,
      };
      await api.saveAgendamento(data);
      form.reset();
      closeModal(document.getElementById("agendamento-modal"));
      await renderAgendamentosView();
      await renderCalendar();
    });

  document
    .getElementById("save-user-btn")
    .addEventListener("click", async () => {
      const form = document.getElementById("user-form");
      const id = form.querySelector("#user-id").value;
      const saveBtn = document.getElementById("save-user-btn");
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
      saveBtn.disabled = true;
      try {
        let result;
        if (id) {
          const userData = {
            name: form["user-name"].value,
            funcao: form["user-funcao"].value,
            isAdmin: form["user-isAdmin"].checked,
          };
          result = await api.saveUser(id, userData);
        } else {
          const userData = {
            email: form["user-email"].value,
            password: form["user-password"].value,
            name: form["user-name"].value,
            funcao: form["user-funcao"].value,
            isAdmin: form["user-isAdmin"].checked,
          };
          if (!userData.email || !userData.password) {
            throw new Error("E-mail e senha são obrigatórios.");
          }
          result = await api.createUser(userData);
        }
        if (result.success) {
          closeModal(document.getElementById("user-modal"));
          await renderUsersView();
        } else {
          alert("Falha: " + (result.message || "Erro desconhecido."));
        }
      } catch (error) {
        alert("Ocorreu um erro: " + error.message);
      } finally {
        saveBtn.innerHTML = "Salvar";
        saveBtn.disabled = false;
      }
    });

  window.editAnimal = async (id) => {
    const animais = await api.getAnimais();
    const item = animais.find((i) => i.id === id);
    if (!item) return;
    const form = document.getElementById("animal-form");
    form["animal-id"].value = item.id || "";
    form["animal-name"].value = item.nome || "";
    form["animal-breed"].value = item.raca || "";
    form["tutor-name"].value = item.tutor || "";
    form["tutor-phone"].value = item.telefone || "";
    form["tutor-address"].value = item.endereco || "";
    form["fur-color"].value = item.cor || "";
    form["fur-type"].value = item.pelo || "curto";
    // --- CAMPOS ATUALIZADOS AQUI ---
    // Garante que os valores corretos sejam selecionados ao editar
    form.querySelector('#species-type').value = item.especie || 'Cachorro';
    form.querySelector('#sex-type').value = item.sexo || 'macho'; // Corrigido para 'macho' (minúsculo)
    form["animal-age"].value = item.idade || "";
    form["animal-weight"].value = item.peso || "";
    form["animal-allergies"].value = item.alergias || "";
    form["animal-notes"].value = item.obs || "";
    openModal("animal-modal");
};

  window.editServico = async (id) => {
    const servicos = await api.getServicos();
    const item = servicos.find((i) => i.id === id);
    if (!item) return;
    const form = document.getElementById("servico-form");
    form.querySelector("#servico-id").value = item.id || "";
    form.querySelector("#servico-nome").value = item.nome || "";
    form.querySelector("#servico-preco").value = item.preco || "";
    form.querySelector("#servico-duracao").value = item.duracao || "";
    form.querySelector("#servico-descricao").value = item.descricao || "";
    openModal("servico-modal");
  };

  window.editAgendamento = async (id) => {
    const agendamentos = await api.getAgendamentos();
    const item = agendamentos.find((i) => i.id === id);
    if (!item) return;
    const form = document.getElementById("agendamento-form");
    form.querySelector("#agendamento-id").value = item.id || "";
    form.querySelector("#agendamento-animal-id").value = item.animalId || "";
    form.querySelector("#agendamento-servico-id").value = item.servicoId || "";
    form.querySelector("#agendamento-data").value = item.data || "";
    form.querySelector("#agendamento-hora").value = item.hora || "";
    form.querySelector("#agendamento-status").value = item.status || "Agendado";
    openModal("agendamento-modal");
  };

  window.editUser = (user) => {
    const form = document.getElementById("user-form");
    document.getElementById("user-modal-title").textContent = "Editar Usuário";
    form.querySelector("#user-id").value = user.Username;
    form.querySelector("#user-name").value = user.name;
    form.querySelector("#user-email").value = user.email;
    form.querySelector("#user-email").disabled = true;
    form.querySelector("#user-funcao").value = user.funcao;
    form.querySelector("#user-isAdmin").checked = user.isAdmin;
    document.getElementById("password-group").style.display = "none";
    openModal("user-modal");
  };

  window.deleteAnimal = async (id) => {
    if (confirm("Tem certeza?")) {
      await api.deleteAnimal(id);
      await renderAll();
    }
  };
  window.deleteServico = async (id) => {
    if (confirm("Tem certeza?")) {
      await api.deleteServico(id);
      await renderAll();
    }
  };
  window.deleteAgendamento = async (id) => {
    if (confirm("Tem certeza?")) {
      await api.deleteAgendamento(id);
      await renderAll();
    }
  };

  window.deleteUser = async (username) => {
    if (confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) {
      try {
        await api.deleteUser(username);
        await renderUsersView();
      } catch (error) {
        alert(
          "Falha ao excluir usuário: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  // Ponto de partida da aplicação
  initializeApp();
});
