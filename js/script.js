document.addEventListener('DOMContentLoaded', async () => {
    
  // --- ELEMENTOS E EVENTOS GERAIS ---
  const menuToggle = document.getElementById('menu-toggle');
  const menuOverlay = document.getElementById('menu-overlay');
  const body = document.body;
  const logoutBtn = document.getElementById('logout-btn');
  const loginSection = document.getElementById('login-section');
  const mainSystem = document.getElementById('main-system');
  const loginForm = document.getElementById('login-form');
  const agendamentosTitle = document.getElementById('agendamentos-title');
  const showAllAgendamentosBtn = document.getElementById('show-all-agendamentos-btn');
  const animalSearchBtn = document.getElementById('animal-search-btn');
  const animalSearchInput = document.getElementById('animal-search-input');
  const animalClearSearchBtn = document.getElementById('animal-clear-search-btn');

  // --- FUNÇÃO DE CONTROLE DE ACESSO ---
  const checkAdminAccess = () => {
    const session = api.getSession();
    const adminElements = document.querySelectorAll('.admin-only');
    const displayValue = session.isAdmin() ? 'block' : 'none';
    
    adminElements.forEach(el => {
        el.style.display = el.tagName === 'LI' ? (session.isAdmin() ? 'list-item' : 'none') : displayValue;
    });
  };

  const closeMenu = () => body.classList.remove('menu-open');
  menuToggle.addEventListener('click', (e) => { e.stopPropagation(); body.classList.toggle('menu-open'); });
  menuOverlay.addEventListener('click', closeMenu);
  
  document.querySelectorAll('.sidebar-menu a').forEach(link => {
      if (link.id !== 'logout-btn') {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeMenu();
            navigateToSection(e.currentTarget.getAttribute('data-section'));
        });
      }
  });

  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (confirm("Tem certeza que deseja sair?")) {
        await api.logout();
        window.location.reload();
    }
  });
  
  const initializeApp = async () => {
      const hasSession = await api.checkAndLoadSession();
      if (hasSession) {
          loginSection.style.display = 'none';
          mainSystem.style.display = 'block';
          checkAdminAccess();
          await renderAll();
      } else {
          loginSection.style.display = 'flex';
          mainSystem.style.display = 'none';
      }
  };

  loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = loginForm.querySelector('button[type="submit"]');
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
      saveBtn.disabled = true;
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const result = await api.login(username, password);

      if (result.success) {
          await initializeApp();
      } else {
          alert(result.message || "Falha no login.");
      }
      saveBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
      saveBtn.disabled = false;
  });
  
  const navigateToSection = (sectionId) => {
      document.querySelectorAll('.menu-link').forEach(el => el.classList.remove('active'));
      document.querySelector(`.menu-link[data-section="${sectionId}"]`)?.classList.add('active');
      document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
      document.getElementById(sectionId)?.classList.add('active');
  };

  const openModal = (modalId) => document.getElementById(modalId)?.classList.add('active');
  const closeModal = (modal) => modal?.classList.remove('active');
  
  document.querySelectorAll('.open-modal').forEach(btn => btn.addEventListener('click', (e) => {
      // Limpa formulários antes de abrir o modal para criação
      const modalId = e.currentTarget.dataset.modal;
      if (modalId === 'user-modal') {
        document.getElementById('user-modal-title').textContent = "Novo Usuário";
        const form = document.getElementById('user-form');
        form.reset();
        form['user-id'] = null; // Garante que não tenha ID de edição
        form['user-email'].disabled = false;
        document.getElementById('password-group').style.display = 'block';
      }
      openModal(modalId);
  }));

  document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
  window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeModal(e.target) });

  animalSearchBtn.addEventListener('click', async () => {
    const searchTerm = animalSearchInput.value.trim();
    if(searchTerm) {
        await renderAnimaisView({ search: searchTerm });
        animalClearSearchBtn.style.display = 'inline-flex';
    }
  });

  animalClearSearchBtn.addEventListener('click', async () => {
    animalSearchInput.value = '';
    animalClearSearchBtn.style.display = 'none';
    await renderAnimaisView();
  });

  const renderAll = async () => {
      await Promise.all([
          renderAnimaisView(), renderServicosCards(), renderAgendamentosView(),
          renderDashboardStats(), renderCalendar(), populateAgendamentoFormSelects(),
          renderUsersView()
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
              <div class="data-card-header"><div><div class="title">${animal.nome}</div><div class="subtitle">${animal.raca}</div></div></div>
              <div class="data-card-body"><strong>Tutor: </strong><span>${animal.tutor}</span></div>
              <span class="desktop-view">${animal.nome}</span><span class="desktop-view">${animal.tutor}</span><span class="desktop-view">${animal.raca}</span>
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
      const grid = document.getElementById('servicos-card-grid');
      grid.innerHTML = '';
      if (!Array.isArray(servicos)) return;
      servicos.forEach(servico => {
          grid.innerHTML += `
              <div class="card">
                  <div class="card-header"><h3>${servico.nome}</h3></div>
                  <div class="card-body">
                      <p><strong>Preço:</strong> R$ ${Number(servico.preco).toFixed(2)}</p>
                      <p><strong>Duração:</strong> ${servico.duracao} minutos</p>
                      <p><strong>Descrição:</strong> ${servico.descricao || 'Nenhuma.'}</p>
                  </div>
                  <div class="card-footer">
                      <button class="btn btn-edit" onclick="editServico('${servico.id}')"><i class="fas fa-edit"></i> Editar</button>
                      <button class="btn btn-delete" onclick="deleteServico('${servico.id}')"><i class="fas fa-trash"></i> Excluir</button>
                  </div>`;
      });
  };
  
  const renderAgendamentosView = async (dateFilter = null) => {
      let agendamentos = await api.getAgendamentos();
      const animais = await api.getAnimais();
      const servicos = await api.getServicos();
      const container = document.getElementById('agendamentos-view-container');
      container.innerHTML = '';
      if (!Array.isArray(agendamentos) || !Array.isArray(animais) || !Array.isArray(servicos)) return;
      if (dateFilter) {
          agendamentos = agendamentos.filter(ag => ag.data === dateFilter);
          agendamentosTitle.textContent = `Agenda de ${new Date(`${dateFilter}T12:00:00`).toLocaleDateString('pt-BR')}`;
          showAllAgendamentosBtn.style.display = 'inline-flex';
      } else {
          agendamentosTitle.textContent = 'Todos os Agendamentos';
          showAllAgendamentosBtn.style.display = 'none';
      }
      agendamentos.sort((a,b) => new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`));
      agendamentos.forEach(ag => {
          const animal = animais.find(a => a.id == ag.animalId);
          const servico = servicos.find(s => s.id == ag.servicoId);
          const dataHora = new Date(`${ag.data}T${ag.hora}`);
          const card = document.createElement('div');
          card.className = 'data-card agendamento-card';
          card.innerHTML = `
              <div class="data-card-header">
                  <div><div class="title">${animal?.nome || 'N/A'}</div><div class="subtitle">${dataHora.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div></div>
              </div>
              <div class="data-card-body">
                  <span><strong>Serviço: </strong> ${servico?.nome || 'N/A'}</span>
                  <span><strong>Tutor: </strong> ${animal?.tutor || 'N/A'}</span>
              </div>
              <span class="desktop-view">${dataHora.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span class="desktop-view">${animal?.nome || 'N/A'}</span>
              <span class="desktop-view">${animal?.tutor || 'N/A'}</span>
              <span class="desktop-view">${servico?.nome || 'N/A'}</span>
              <span class="desktop-view"><span class="badge badge-${ag.status}">${ag.status}</span></span>
              <div class="data-card-actions">
                  <button title="Editar" class="btn-edit action-btn"><i class="fas fa-edit"></i></button>
                  <button title="Excluir" class="btn-delete action-btn"><i class="fas fa-trash"></i></button>
              </div>`;
          card.querySelector('.btn-edit').addEventListener('click', () => editAgendamento(ag.id));
          card.querySelector('.btn-delete').addEventListener('click', () => deleteAgendamento(ag.id));
          container.appendChild(card);
      });
  };

  const renderUsersView = async () => {
    const users = await api.getUsers();
    const container = document.getElementById('users-view-container');
    container.innerHTML = '';
    if (!Array.isArray(users)) return;
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'data-card user-card';
        card.innerHTML = `
            <div class="data-card-header"><div class="title">${user.name || '(Sem nome)'}</div><div class="subtitle">${user.email}</div></div>
            <div class="data-card-body"><strong>Função: </strong><span>${user.funcao}</span></div>
            <span class="desktop-view">${user.name || '(Sem nome)'}</span>
            <span class="desktop-view">${user.email}</span>
            <span class="desktop-view">${user.funcao}</span>
            <span class="desktop-view">${user.isAdmin ? 'Sim' : 'Não'}</span>
            <div class="data-card-actions">
                <button title="Editar" class="btn-edit action-btn"><i class="fas fa-edit"></i></button>
                <button title="Excluir" class="btn-delete action-btn" ${user.Username.toLowerCase() === 'admin' ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
            </div>`;
        card.querySelector('.btn-edit').addEventListener('click', () => editUser(user));
        if (user.Username.toLowerCase() !== 'admin') {
            card.querySelector('.btn-delete').addEventListener('click', () => deleteUser(user.Username));
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
          agendamentosHoje: Array.isArray(agendamentos) ? agendamentos.filter(a => a.data === new Date().toISOString().slice(0, 10)).length : 0,
          servicos: Array.isArray(servicos) ? servicos.length : 0,
          clientes: Array.isArray(animais) ? new Set(animais.map(a => a.tutor)).size : 0
      };
      document.getElementById('dashboard-stats').innerHTML = `
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
      const monthName = date.toLocaleString('pt-BR', { month: 'long' });
      let header = `<div class="calendar-header"><button class="btn btn-secondary" id="prev-month"><i class="fas fa-chevron-left"></i></button><h3>${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${currentYear}</h3><button class="btn btn-secondary" id="next-month"><i class="fas fa-chevron-right"></i></button></div>`;
      let grid = `<div class="calendar-grid">${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => `<div class="calendar-day-header">${d}</div>`).join('')}`;
      const firstDay = date.getDay();
      const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
      for (let i = 0; i < firstDay; i++) { grid += `<div class="calendar-day other-month"></div>`; }
      for (let i = 1; i <= lastDate; i++) {
          const dayDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const dayEvents = Array.isArray(agendamentos) ? agendamentos.filter(a => a.data === dayDateStr) : [];
          grid += `<div class="calendar-day" data-date="${dayDateStr}"><div class="day-number">${i}</div>${dayEvents.length > 0 ? `<div class="event-indicator">${dayEvents.length}</div>` : ''}</div>`;
      }
      document.getElementById('calendar-container').innerHTML = header + grid + '</div>';
      document.getElementById('prev-month').onclick = () => { currentMonth--; if(currentMonth < 0){ currentMonth = 11; currentYear--; } renderCalendar(); };
      document.getElementById('next-month').onclick = () => { currentMonth++; if(currentMonth > 11){ currentMonth = 0; currentYear++; } renderCalendar(); };
      document.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => day.addEventListener('click', () => showAppointmentsForDay(day.dataset.date)));
  };

  const showAppointmentsForDay = async (date) => {
      const agendamentos = await api.getAgendamentos();
      const animais = await api.getAnimais();
      const servicos = await api.getServicos();
      document.getElementById('daily-appointments-title').textContent = `Agenda de ${new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'})}`;
      const list = document.getElementById('daily-appointments-list');
      list.innerHTML = '<li>Nenhum agendamento para este dia.</li>';
      if (!Array.isArray(agendamentos)) return;
      const dailyAgendamentos = agendamentos.filter(ag => ag.data === date).sort((a,b) => a.hora.localeCompare(b.hora));
      if (dailyAgendamentos.length > 0) list.innerHTML = '';
      dailyAgendamentos.forEach(ag => {
          const animal = animais.find(a => a.id == ag.animalId);
          const servico = servicos.find(s => s.id == ag.servicoId);
          const li = document.createElement('li');
          li.innerHTML = `<div class="time">${ag.hora}</div><div class="pet-name">${animal?.nome || '...'}</div><div class="service-name">${servico?.nome || '...'}</div>`;
          li.addEventListener('click', () => showAppointmentDetails(ag.id));
          list.appendChild(li);
      });
  };

  const showAppointmentDetails = async (id) => {
      const agendamento = (await api.getAgendamentos()).find(a => a.id == id); if (!agendamento) return;
      const animal = (await api.getAnimais()).find(a => a.id == agendamento.animalId);
      const servico = (await api.getServicos()).find(s => s.id == agendamento.servicoId);
      document.getElementById('appointment-details-body').innerHTML = `<h4><i class="fas fa-calendar-alt"></i> ${new Date(`${agendamento.data}T${agendamento.hora}`).toLocaleString('pt-BR', {dateStyle: 'full', timeStyle: 'short'})}</h4><hr><h5><i class="fas fa-dog"></i> Pet</h5><p><strong>Nome:</strong> ${animal?.nome||'N/A'}</p><p><strong>Tutor:</strong> ${animal?.tutor||'N/A'} (${animal?.telefone||'N/A'})</p><p><strong>Observações:</strong> ${animal?.obs||'Nenhuma'}</p><hr><h5><i class="fas fa-concierge-bell"></i> Serviço</h5><p><strong>Nome:</strong> ${servico?.nome||'N/A'}</p><p><strong>Preço:</strong> R$ ${Number(servico?.preco||0).toFixed(2)}</p><p><strong>Duração:</strong> ${servico?.duracao||'N/A'} minutos</p>`;
      openModal('appointment-details-modal');
  };

  showAllAgendamentosBtn.addEventListener('click', () => { renderAgendamentosView(); });
  const populateAgendamentoFormSelects = async () => {
      const animais = await api.getAnimais();
      const servicos = await api.getServicos();
      const animalSelect = document.getElementById('agendamento-animal-id');
      const servicoSelect = document.getElementById('agendamento-servico-id');
      animalSelect.innerHTML = '<option value="">Selecione...</option>';
      servicoSelect.innerHTML = '<option value="">Selecione...</option>';
      if (Array.isArray(animais)) { animais.forEach(a => animalSelect.innerHTML += `<option value="${a.id}">${a.nome} (${a.tutor})</option>`); }
      if (Array.isArray(servicos)) { servicos.forEach(s => servicoSelect.innerHTML += `<option value="${s.id}">${s.nome}</option>`); }
  };
  
  const renderReport = () => { const container = document.getElementById('report-container'); const template = document.getElementById('technical-report-template'); if(container && template) { container.innerHTML = template.innerHTML; } };

  // --- LÓGICA CRUD ---
  document.getElementById('save-animal-btn').addEventListener('click', async () => {
      const form = document.getElementById('animal-form');
      const data = { id: form['animal-id'].value || null, nome: form['animal-name'].value, raca: form['animal-breed'].value, tutor: form['tutor-name'].value, telefone: form['tutor-phone'].value, endereco: form['tutor-address'].value, cor: form['fur-color'].value, pelo: form['fur-type'].value, idade: form['animal-age'].value, peso: form['animal-weight'].value, alergias: form['animal-allergies'].value, obs: form['animal-notes'].value };
      await api.saveAnimal(data);
      form.reset(); form['animal-id'].value = '';
      closeModal(document.getElementById('animal-modal'));
      await renderAll();
  });
  
  document.getElementById('save-servico-btn').addEventListener('click', async () => {
      const form = document.getElementById('servico-form');
      const data = { id: form['servico-id'].value || null, nome: form['servico-nome'].value, preco: form['servico-preco'].value, duracao: form['servico-duracao'].value, descricao: form['servico-descricao'].value };
      await api.saveServico(data);
      form.reset(); form['servico-id'].value = '';
      closeModal(document.getElementById('servico-modal'));
      await renderAll();
  });

  document.getElementById('save-agendamento-btn').addEventListener('click', async () => {
      const form = document.getElementById('agendamento-form');
      const data = { id: form['agendamento-id'].value || null, animalId: form['agendamento-animal-id'].value, servicoId: form['agendamento-servico-id'].value, data: form['agendamento-data'].value, hora: form['agendamento-hora'].value, status: form['agendamento-status'].value };
      await api.saveAgendamento(data);
      form.reset(); form['agendamento-id'].value = '';
      closeModal(document.getElementById('agendamento-modal'));
      await renderAll();
  });

  window.editAnimal = async (id) => {
    const animais = await api.getAnimais(); const item = animais.find(i => i.id === id); if (!item) return;
    const form = document.getElementById('animal-form');
    form['animal-id'].value = item.id || ''; form['animal-name'].value = item.nome || ''; form['animal-breed'].value = item.raca || ''; form['tutor-name'].value = item.tutor || ''; form['tutor-phone'].value = item.telefone || ''; form['tutor-address'].value = item.endereco || ''; form['fur-color'].value = item.cor || ''; form['fur-type'].value = item.pelo || 'curto'; form['animal-age'].value = item.idade || ''; form['animal-weight'].value = item.peso || ''; form['animal-allergies'].value = item.alergias || ''; form['animal-notes'].value = item.obs || '';
    openModal('animal-modal');
  };

  window.editServico = async (id) => {
    const servicos = await api.getServicos(); const item = servicos.find(i => i.id === id); if (!item) return;
    const form = document.getElementById('servico-form');
    form['servico-id'].value = item.id || ''; form['servico-nome'].value = item.nome || ''; form['servico-preco'].value = item.preco || ''; form['servico-duracao'].value = item.duracao || ''; form['servico-descricao'].value = item.descricao || '';
    openModal('servico-modal');
  };

  window.editAgendamento = async (id) => {
    const agendamentos = await api.getAgendamentos(); const item = agendamentos.find(i => i.id === id); if (!item) return;
    const form = document.getElementById('agendamento-form');
    form['agendamento-id'].value = item.id || ''; form['agendamento-animal-id'].value = item.animalId || ''; form['agendamento-servico-id'].value = item.servicoId || ''; form['agendamento-data'].value = item.data || ''; form['agendamento-hora'].value = item.hora || ''; form['agendamento-status'].value = item.status || 'Agendado';
    openModal('agendamento-modal');
  };

  window.deleteAnimal = async (id) => { if (confirm('Tem certeza?')) { await api.deleteAnimal(id); await renderAll(); } };
  window.deleteServico = async (id) => { if (confirm('Tem certeza?')) { await api.deleteServico(id); await renderAll(); } };
  window.deleteAgendamento = async (id) => { if (confirm('Tem certeza?')) { await api.deleteAgendamento(id); await renderAll(); } };
  
  document.getElementById('save-user-btn').addEventListener('click', async () => {
    const form = document.getElementById('user-form');
    const id = form['user-id'];
    const saveBtn = document.getElementById('save-user-btn');
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    saveBtn.disabled = true;
    try {
        let result;
        if (id) {
            const userData = { name: form['user-name'].value, funcao: form['user-funcao'].value, isAdmin: form['user-isAdmin'].checked };
            result = await api.saveUser(id, userData);
        } else {
            const userData = { email: form['user-email'].value, password: form['user-password'].value, name: form['user-name'].value, funcao: form['user-funcao'].value, isAdmin: form['user-isAdmin'].checked };
            if (!userData.email || !userData.password) { throw new Error("E-mail e senha são obrigatórios."); }
            result = await api.createUser(userData);
        }
        if (result.success) {
            form.reset();
            form['user-id'] = null;
            form['user-email'].disabled = false;
            document.getElementById('password-group').style.display = 'block';
            closeModal(document.getElementById('user-modal'));
            await renderUsersView();
        } else {
            alert("Falha: " + (result.message || "Erro desconhecido."));
        }
    } catch (error) {
        alert("Ocorreu um erro: " + error.message);
    } finally {
        saveBtn.innerHTML = 'Salvar';
        saveBtn.disabled = false;
    }
  });

  window.editUser = (user) => {
    const form = document.getElementById('user-form');
    document.getElementById('user-modal-title').textContent = "Editar Usuário";
    form['user-id'] = user.Username;
    form['user-name'].value = user.name;
    form['user-email'].value = user.email;
    form['user-email'].disabled = true;
    form['user-funcao'].value = user.funcao;
    form['user-isAdmin'].checked = user.isAdmin;
    document.getElementById('password-group').style.display = 'none';
    openModal('user-modal');
  };
  
  window.deleteUser = async (username) => {
      if (confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) {
          try {
              await api.deleteUser(username);
              await renderUsersView();
          } catch (error) {
              alert("Falha ao excluir usuário: " + (error.response?.data?.message || error.message));
          }
      }
  };

  // Ponto de partida da aplicação
  initializeApp();
});

const checkAdminAccess = () => {
    const session = api.getSession();
    // Adiciona ou remove a classe 'is-admin' do body baseado no grupo do usuário.
    // É simples e muito mais confiável.
    document.body.classList.toggle('is-admin', session.isAdmin());
};