// document.addEventListener('DOMContentLoaded', async () => {

//   // --- LÓGICA DO MENU MOBILE ---
//   const menuToggle = document.getElementById('menu-toggle');
//   const menuOverlay = document.getElementById('menu-overlay');
//   const body = document.body;

//   const closeMenu = () => {
//       body.classList.remove('menu-open');
//   };

//   menuToggle.addEventListener('click', (e) => {
//       e.stopPropagation();
//       body.classList.toggle('menu-open');
//   });

//   menuOverlay.addEventListener('click', closeMenu);
//   document.querySelectorAll('.sidebar-menu a').forEach(link => {
//       link.addEventListener('click', closeMenu);
//   });

//   // --- ELEMENTOS DO DOM (Restante) ---
//   const loginSection = document.getElementById('login-section');
//   const mainSystem = document.getElementById('main-system');
//   const loginForm = document.getElementById('login-form');
//   const agendamentosTitle = document.getElementById('agendamentos-title');
//   const showAllAgendamentosBtn = document.getElementById('show-all-agendamentos-btn');

//   // --- INICIALIZAÇÃO DA "API" ---
//   await (async function initDatabase() {
//       if(typeof api !== 'undefined' && typeof api.initDatabase === 'function') {
//           await api.initDatabase();
//       } else {
//           console.error("api.js não foi carregado ou não contém initDatabase.");
//       }
//   })();

//   // --- LÓGICA DE LOGIN ---
//   loginForm.addEventListener('submit', async (e) => {
//       e.preventDefault();
//       const username = document.getElementById('username').value;
//       const password = document.getElementById('password').value;
//       const result = await api.login(username, password);

//       if (result.success) {
//           loginSection.style.display = 'none';
//           mainSystem.style.display = 'block';
//           await renderAll();
//       } else {
//           alert(result.message || "Falha no login.");
//       }
//   });

//   // --- LÓGICA DE NAVEGAÇÃO ---
//   const navigateToSection = (sectionId) => {
//       document.querySelectorAll('.menu-link').forEach(el => el.classList.remove('active'));
//       const linkToActivate = document.querySelector(`.menu-link[data-section="${sectionId}"]`);
//       if (linkToActivate) linkToActivate.classList.add('active');

//       document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
//       const sectionToShow = document.getElementById(sectionId);
//       if (sectionToShow) sectionToShow.classList.add('active');
//   };

//   document.querySelectorAll('.menu-link').forEach(link => {
//       link.addEventListener('click', (e) => {
//           e.preventDefault();
//           navigateToSection(e.currentTarget.getAttribute('data-section'));
//       });
//   });

//   // --- LÓGICA DE MODAIS ---
//   const openModal = (modalId) => {
//       const modal = document.getElementById(modalId);
//       if(modal) modal.classList.add('active');
//   };
//   const closeModal = (modal) => {
//       if(modal) modal.classList.remove('active');
//   };

//   document.querySelectorAll('.open-modal').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.modal)));
//   document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
//   window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeModal(e.target) });

//   // --- RENDERIZAÇÃO ---
//   const renderAll = async () => {
//       await Promise.all([
//           renderAnimaisView(),
//           renderServicosCards(),
//           renderAgendamentosView(),
//           renderDashboardStats(),
//           renderCalendar(),
//           populateAgendamentoFormSelects()
//       ]);
//       const today = new Date().toISOString().slice(0, 10);
//       await showAppointmentsForDay(today);
//       renderReport();
//   };

//   const renderAnimaisView = async () => {
//       const animais = await api.getAnimais();
//       const container = document.getElementById('animais-view-container');
//       container.innerHTML = '';
//       animais.forEach(animal => {
//           const card = document.createElement('div');
//           card.className = 'data-card animal-card';
//           card.innerHTML = `
//               <div class="data-card-header">
//                   <div>
//                       <div class="title">${animal.nome}</div>
//                       <div class="subtitle">${animal.raca}</div>
//                   </div>
//               </div>
//               <div class="data-card-body">
//                   <strong>Tutor: </strong><span>${animal.tutor}</span>
//               </div>

//               <span class="desktop-view">${animal.nome}</span>
//               <span class="desktop-view">${animal.tutor}</span>
//               <span class="desktop-view">${animal.raca}</span>

//               <div class="data-card-actions">
//                   <button title="Editar" class="btn-edit action-btn"><i class="fas fa-edit"></i></button>
//                   <button title="Excluir" class="btn-delete action-btn"><i class="fas fa-trash"></i></button>
//               </div>
//           `;
//           card.querySelector('.btn-edit').addEventListener('click', () => editAnimal(animal.id));
//           card.querySelector('.btn-delete').addEventListener('click', () => deleteAnimal(animal.id));
//           container.appendChild(card);
//       });
//   };

//   const renderServicosCards = async () => {
//       const servicos = await api.getServicos();
//       const grid = document.getElementById('servicos-card-grid');
//       grid.innerHTML = '';
//       servicos.forEach(servico => {
//           grid.innerHTML += `
//               <div class="card">
//                   <div class="card-header"><h3>${servico.nome}</h3></div>
//                   <div class="card-body">
//                       <p><strong>Preço:</strong> R$ ${Number(servico.preco).toFixed(2)}</p>
//                       <p><strong>Duração:</strong> ${servico.duracao} minutos</p>
//                       <p><strong>Descrição:</strong> ${servico.descricao || 'Nenhuma descrição fornecida.'}</p>
//                   </div>
//                   <div class="card-footer">
//                       <button class="btn btn-edit" onclick="editServico(${servico.id})"><i class="fas fa-edit"></i> Editar</button>
//                       <button class="btn btn-delete" onclick="deleteServico(${servico.id})"><i class="fas fa-trash"></i> Excluir</button>
//                   </div>
//               </div>
//           `;
//       });
//   };

//   const renderAgendamentosView = async (dateFilter = null) => {
//       let agendamentos = await api.getAgendamentos();
//       const animais = await api.getAnimais();
//       const servicos = await api.getServicos();
//       const container = document.getElementById('agendamentos-view-container');
//       container.innerHTML = '';

//       if (dateFilter) {
//           agendamentos = agendamentos.filter(ag => ag.data === dateFilter);
//           const formattedDate = new Date(`${dateFilter}T12:00:00`).toLocaleDateString('pt-BR');
//           agendamentosTitle.textContent = `Agenda de ${formattedDate}`;
//           showAllAgendamentosBtn.style.display = 'inline-flex';
//       } else {
//           agendamentosTitle.textContent = 'Todos os Agendamentos';
//           showAllAgendamentosBtn.style.display = 'none';
//       }

//       agendamentos.sort((a,b) => new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`));

//       agendamentos.forEach(ag => {
//           const animal = animais.find(a => a.id == ag.animalId);
//           const servico = servicos.find(s => s.id == ag.servicoId);
//           const dataHora = new Date(`${ag.data}T${ag.hora}`);

//           const card = document.createElement('div');
//           card.className = 'data-card agendamento-card';
//           card.innerHTML = `
//               <div class="data-card-header">
//                   <div>
//                       <div class="title">${animal ? animal.nome : 'N/A'}</div>
//                       <div class="subtitle">${dataHora.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div>
//                   </div>
//               </div>
//               <div class="data-card-body">
//                   <span><strong>Serviço: </strong> ${servico ? servico.nome : 'N/A'}</span>
//                   <span><strong>Tutor: </strong> ${animal ? animal.tutor : 'N/A'}</span>
//               </div>

//               <span class="desktop-view">${dataHora.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
//               <span class="desktop-view">${animal ? animal.nome : 'N/A'}</span>
//               <span class="desktop-view">${animal ? animal.tutor : 'N/A'}</span>
//               <span class="desktop-view">${servico ? servico.nome : 'N/A'}</span>
//               <span class="desktop-view"><span class="badge badge-${ag.status}">${ag.status}</span></span>

//               <div class="data-card-actions">
//                   <button title="Editar" class="btn-edit action-btn"><i class="fas fa-edit"></i></button>
//                   <button title="Excluir" class="btn-delete action-btn"><i class="fas fa-trash"></i></button>
//               </div>
//           `;
//           card.querySelector('.btn-edit').addEventListener('click', () => editAgendamento(ag.id));
//           card.querySelector('.btn-delete').addEventListener('click', () => deleteAgendamento(ag.id));
//           container.appendChild(card);
//       });
//   };

//   const renderDashboardStats = async () => {
//       const animais = await api.getAnimais();
//       const agendamentos = await api.getAgendamentos();
//       const servicos = await api.getServicos();
//       const today = new Date().toISOString().slice(0, 10);
//       const stats = {
//           animais: animais.length,
//           agendamentosHoje: agendamentos.filter(a => a.data === today).length,
//           servicos: servicos.length,
//           clientes: new Set(animais.map(a => a.tutor)).size
//       };
//       document.getElementById('dashboard-stats').innerHTML = `
//           <div class="stat-card"><div class="stat-icon" style="background: var(--primary);"><i class="fas fa-dog"></i></div><div class="stat-info"><h3>${stats.animais}</h3><p>Animais</p></div></div>
//           <div class="stat-card"><div class="stat-icon" style="background: var(--success);"><i class="fas fa-calendar-check"></i></div><div class="stat-info"><h3>${stats.agendamentosHoje}</h3><p>Agenda Hoje</p></div></div>
//           <div class="stat-card"><div class="stat-icon" style="background: var(--info);"><i class="fas fa-concierge-bell"></i></div><div class="stat-info"><h3>${stats.servicos}</h3><p>Serviços</p></div></div>
//           <div class="stat-card"><div class="stat-icon" style="background: var(--accent);"><i class="fas fa-users"></i></div><div class="stat-info"><h3>${stats.clientes}</h3><p>Clientes</p></div></div>
//       `;
//   };

//   let currentMonth = new Date().getMonth();
//   let currentYear = new Date().getFullYear();

//   const renderCalendar = async () => {
//       const container = document.getElementById('calendar-container');
//       const agendamentos = await api.getAgendamentos();
//       const date = new Date(currentYear, currentMonth, 1);
//       const monthName = date.toLocaleString('pt-BR', { month: 'long' });

//       let header = `<div class="calendar-header">
//           <button class="btn btn-secondary" id="prev-month"><i class="fas fa-chevron-left"></i></button>
//           <h3>${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${currentYear}</h3>
//           <button class="btn btn-secondary" id="next-month"><i class="fas fa-chevron-right"></i></button>
//       </div>`;

//       let grid = `<div class="calendar-grid">
//           ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
//       `;

//       const firstDay = date.getDay();
//       const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

//       for (let i = 0; i < firstDay; i++) {
//           grid += `<div class="calendar-day other-month"></div>`;
//       }

//       for (let i = 1; i <= lastDate; i++) {
//           const dayDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
//           const dayEvents = agendamentos.filter(a => a.data === dayDateStr);

//           let eventsIndicator = '';
//           if (dayEvents.length > 0) {
//               eventsIndicator = `<div class="event-indicator">${dayEvents.length}</div>`;
//           }

//           grid += `<div class="calendar-day" data-date="${dayDateStr}">
//               <div class="day-number">${i}</div>
//               ${eventsIndicator}
//           </div>`;
//       }

//       container.innerHTML = header + grid + '</div>';
//       document.getElementById('prev-month').onclick = () => { currentMonth--; if(currentMonth < 0){ currentMonth = 11; currentYear--; } renderCalendar(); showAppointmentsForDay(new Date(currentYear, currentMonth, 1).toISOString().slice(0,10)); };
//       document.getElementById('next-month').onclick = () => { currentMonth++; if(currentMonth > 11){ currentMonth = 0; currentYear++; } renderCalendar(); showAppointmentsForDay(new Date(currentYear, currentMonth, 1).toISOString().slice(0,10)); };

//       document.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
//           day.addEventListener('click', () => {
//               showAppointmentsForDay(day.dataset.date);
//           });
//       });
//   };

//   const showAppointmentsForDay = async (date) => {
//       const agendamentos = await api.getAgendamentos();
//       const animais = await api.getAnimais();
//       const servicos = await api.getServicos();

//       const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'});
//       document.getElementById('daily-appointments-title').textContent = `Agenda de ${formattedDate}`;

//       const list = document.getElementById('daily-appointments-list');
//       list.innerHTML = '';

//       const dailyAgendamentos = agendamentos
//           .filter(ag => ag.data === date)
//           .sort((a,b) => a.hora.localeCompare(b.hora));

//       if (dailyAgendamentos.length === 0) {
//           list.innerHTML = '<li>Nenhum agendamento para este dia.</li>';
//           return;
//       }

//       dailyAgendamentos.forEach(ag => {
//           const animal = animais.find(a => a.id == ag.animalId);
//           const servico = servicos.find(s => s.id == ag.servicoId);
//           const li = document.createElement('li');
//           li.innerHTML = `
//               <div class="time">${ag.hora}</div>
//               <div class="pet-name">${animal ? animal.nome : 'Pet não encontrado'}</div>
//               <div class="service-name">${servico ? servico.nome : 'Serviço não encontrado'}</div>
//           `;
//           li.addEventListener('click', () => showAppointmentDetails(ag.id));
//           list.appendChild(li);
//       });
//   };

//   const showAppointmentDetails = async (id) => {
//       const agendamento = (await api.getAgendamentos()).find(a => a.id == id);
//       if (!agendamento) return;

//       const animal = (await api.getAnimais()).find(a => a.id == agendamento.animalId);
//       const servico = (await api.getServicos()).find(s => s.id == agendamento.servicoId);

//       const detailsBody = document.getElementById('appointment-details-body');
//       detailsBody.innerHTML = `
//           <h4><i class="fas fa-calendar-alt"></i> ${new Date(`${agendamento.data}T${agendamento.hora}`).toLocaleString('pt-BR', {dateStyle: 'full', timeStyle: 'short'})}</h4>
//           <hr>
//           <h5><i class="fas fa-dog"></i> Pet</h5>
//           <p><strong>Nome:</strong> ${animal?.nome || 'N/A'}</p>
//           <p><strong>Tutor:</strong> ${animal?.tutor || 'N/A'} (${animal?.telefone || 'N/A'})</p>
//           <p><strong>Raça:</strong> ${animal?.raca || 'N/A'}</p>
//           <p><strong>Observações do Pet:</strong> ${animal?.obs || 'Nenhuma'}</p>
//           <hr>
//           <h5><i class="fas fa-concierge-bell"></i> Serviço</h5>
//           <p><strong>Nome:</strong> ${servico?.nome || 'N/A'}</p>
//           <p><strong>Preço:</strong> R$ ${Number(servico?.preco || 0).toFixed(2)}</p>
//           <p><strong>Duração:</strong> ${servico?.duracao || 'N/A'} minutos</p>
//       `;
//       openModal('appointment-details-modal');
//   };

//   showAllAgendamentosBtn.addEventListener('click', () => {
//       renderAgendamentosView();
//   });

//   const populateAgendamentoFormSelects = async () => {
//       const animais = await api.getAnimais();
//       const servicos = await api.getServicos();
//       const animalSelect = document.getElementById('agendamento-animal-id');
//       const servicoSelect = document.getElementById('agendamento-servico-id');
//       animalSelect.innerHTML = '<option value="">Selecione um animal</option>';
//       servicoSelect.innerHTML = '<option value="">Selecione um serviço</option>';
//       animais.forEach(a => animalSelect.innerHTML += `<option value="${a.id}">${a.nome} (Tutor: ${a.tutor})</option>`);
//       servicos.forEach(s => servicoSelect.innerHTML += `<option value="${s.id}">${s.nome}</option>`);
//   };

//   const renderReport = () => {
//       const container = document.getElementById('report-container');
//       const template = document.getElementById('technical-report-template');
//       if(container && template) {
//           container.innerHTML = template.innerHTML;
//       }
//   };

//   // --- LÓGICA CRUD (INTERAÇÃO COM O USUÁRIO) ---
//   document.getElementById('save-animal-btn').addEventListener('click', async () => {
//       const form = document.getElementById('animal-form');
//       const animalData = {
//           id: form['animal-id'].value ? Number(form['animal-id'].value) : null,
//           nome: form['animal-name'].value, raca: form['animal-breed'].value, tutor: form['tutor-name'].value,
//           telefone: form['tutor-phone'].value, endereco: form['tutor-address'].value, cor: form['fur-color'].value,
//           pelo: form['fur-type'].value, idade: form['animal-age'].value, peso: form['animal-weight'].value,
//           alergias: form['animal-allergies'].value, obs: form['animal-notes'].value
//       };
//       await api.saveAnimal(animalData);
//       form.reset(); form['animal-id'].value = '';
//       closeModal(document.getElementById('animal-modal'));
//       await renderAll();
//   });

//   window.editAnimal = async (id) => {
//       const item = (await api.getAnimais()).find(i => i.id == id); if (!item) return;
//       const form = document.getElementById('animal-form');
//       form['animal-id'].value = item.id; form['animal-name'].value = item.nome; form['animal-breed'].value = item.raca;
//       form['tutor-name'].value = item.tutor; form['tutor-phone'].value = item.telefone; form['tutor-address'].value = item.endereco;
//       form['fur-color'].value = item.cor; form['fur-type'].value = item.pelo; form['animal-age'].value = item.idade;
//       form['animal-weight'].value = item.peso; form['animal-allergies'].value = item.alergias; form['animal-notes'].value = item.obs;
//       openModal('animal-modal');
//   };

//   window.deleteAnimal = async (id) => {
//       if (confirm('Tem certeza? Esta ação removerá também os agendamentos deste pet.')) {
//           await api.deleteAnimal(id);
//           await renderAll();
//       }
//   };

//    document.getElementById('save-servico-btn').addEventListener('click', async () => {
//       const form = document.getElementById('servico-form');
//       const servicoData = {
//           id: form['servico-id'].value ? Number(form['servico-id'].value) : null,
//           nome: form['servico-nome'].value, preco: form['servico-preco'].value,
//           duracao: form['servico-duracao'].value, descricao: form['servico-descricao'].value
//       };
//       await api.saveServico(servicoData);
//       form.reset(); form['servico-id'].value = '';
//       closeModal(document.getElementById('servico-modal'));
//       await renderAll();
//   });

//   window.editServico = async (id) => {
//       const item = (await api.getServicos()).find(i => i.id == id); if (!item) return;
//       const form = document.getElementById('servico-form');
//       form['servico-id'].value = item.id; form['servico-nome'].value = item.nome;
//       form['servico-preco'].value = item.preco; form['servico-duracao'].value = item.duracao;
//       form['servico-descricao'].value = item.descricao;
//       openModal('servico-modal');
//   };

//   window.deleteServico = async (id) => {
//       if (confirm('Tem certeza?')) {
//           await api.deleteServico(id);
//           await renderAll();
//       }
//   };

//   document.getElementById('save-agendamento-btn').addEventListener('click', async () => {
//       const form = document.getElementById('agendamento-form');
//       const agendamentoData = {
//           id: form['agendamento-id'].value ? Number(form['agendamento-id'].value) : null,
//           animalId: form['agendamento-animal-id'].value, servicoId: form['agendamento-servico-id'].value,
//           data: form['agendamento-data'].value, hora: form['agendamento-hora'].value, status: form['agendamento-status'].value
//       };
//       await api.saveAgendamento(agendamentoData);
//       form.reset(); form['agendamento-id'].value = '';
//       closeModal(document.getElementById('agendamento-modal'));
//       await renderAll();
//   });

//   window.editAgendamento = async (id) => {
//       const item = (await api.getAgendamentos()).find(i => i.id == id); if (!item) return;
//       const form = document.getElementById('agendamento-form');
//       form['agendamento-id'].value = item.id; form['agendamento-animal-id'].value = item.animalId;
//       form['agendamento-servico-id'].value = item.servicoId; form['agendamento-data'].value = item.data;
//       form['agendamento-hora'].value = item.hora; form['agendamento-status'].value = item.status;
//       openModal('agendamento-modal');
//   };

//   window.deleteAgendamento = async (id) => {
//       if (confirm('Tem certeza?')) {
//           await api.deleteAgendamento(id);
//           await renderAll();
//       }
//   };
// });

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

  const checkAdminAccess = () => {
      const session = api.getSession();
      const adminElements = document.querySelectorAll('.admin-only');
      if (session.isAdmin()) {
          adminElements.forEach(el => {
              el.style.display = el.tagName === 'LI' ? 'list-item' : 'block';
          });
      } else {
          adminElements.forEach(el => {
              el.style.display = 'none';
          });
      }
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
  
// Bloco Novo e Corrigido

  // --- LÓGICA DE INICIALIZAÇÃO DA APLICAÇÃO ---
  const initializeApp = async () => {
      // Chama a nova função da API para verificar se já existe uma sessão
      const hasSession = await api.checkAndLoadSession();

      if (hasSession) {
          console.log("Sessão válida encontrada, iniciando o sistema...");
          loginSection.style.display = 'none';
          mainSystem.style.display = 'block';
          checkAdminAccess(); // Verifica se o usuário é admin
          await renderAll();    // Renderiza todos os dados
      } else {
          console.log("Nenhuma sessão encontrada, exibindo tela de login.");
          loginSection.style.display = 'flex'; // Garante que a tela de login esteja visível
          mainSystem.style.display = 'none';
      }
  };

  // --- LÓGICA DE LOGIN (quando o usuário clica em Entrar) ---
  loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = loginForm.querySelector('button[type="submit"]');
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
      saveBtn.disabled = true;

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const result = await api.login(username, password);

      if (result.success) {
          await initializeApp(); // Reutiliza a função de inicialização
      } else {
          alert(result.message || "Falha no login.");
      }
      
      saveBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
      saveBtn.disabled = false;
  });

  // Inicia a aplicação assim que a página carrega
  initializeApp();
  
  const navigateToSection = (sectionId) => {
      document.querySelectorAll('.menu-link').forEach(el => el.classList.remove('active'));
      document.querySelector(`.menu-link[data-section="${sectionId}"]`)?.classList.add('active');
      document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
      document.getElementById(sectionId)?.classList.add('active');
  };

  const openModal = (modalId) => document.getElementById(modalId)?.classList.add('active');
  const closeModal = (modal) => modal?.classList.remove('active');
  
  document.querySelectorAll('.open-modal').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.modal)));
  document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
  window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeModal(e.target) });

  const renderAll = async () => {
      await Promise.all([
          renderAnimaisView(),
          renderServicosCards(),
          renderAgendamentosView(),
          renderDashboardStats(),
          renderCalendar(),
          populateAgendamentoFormSelects(),
          renderUsersView()
      ]);
      await showAppointmentsForDay(new Date().toISOString().slice(0, 10));
      renderReport();
  };

  const renderAnimaisView = async () => {
      const animais = await api.getAnimais();
      const container = document.getElementById('animais-view-container');
      container.innerHTML = '';
      if (!Array.isArray(animais)) return;
      animais.forEach(animal => {
          const card = document.createElement('div');
          card.className = 'data-card animal-card';
          card.innerHTML = `
              <div class="data-card-header"><div><div class="title">${animal.nome}</div><div class="subtitle">${animal.raca}</div></div></div>
              <div class="data-card-body"><strong>Tutor: </strong><span>${animal.tutor}</span></div>
              <span class="desktop-view">${animal.nome}</span>
              <span class="desktop-view">${animal.tutor}</span>
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
            <div class="data-card-header"><div class="title">${user.email}</div></div>
            <div class="data-card-body"><strong>Função: </strong><span>${user.role || 'Padrão'}</span></div>
            <span class="desktop-view">${user.email}</span>
            <span class="desktop-view">${user.role || 'Padrão'}</span>
            <div class="data-card-actions">
                <button title="Excluir" class="btn-delete action-btn"><i class="fas fa-trash"></i></button>
            </div>`;
        // CORREÇÃO FINAL E DEFINITIVA: Passando user.id, que é o que o backend agora fornece
        card.querySelector('.btn-delete').addEventListener('click', () => deleteUser(user.id));
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
    const item = (await api.getAnimais()).find(i => i.id === id); if (!item) return;
    const form = document.getElementById('animal-form');
    form['animal-id'].value = item.id || ''; form['animal-name'].value = item.nome || ''; form['animal-breed'].value = item.raca || ''; form['tutor-name'].value = item.tutor || ''; form['tutor-phone'].value = item.telefone || ''; form['tutor-address'].value = item.endereco || ''; form['fur-color'].value = item.cor || ''; form['fur-type'].value = item.pelo || 'curto'; form['animal-age'].value = item.idade || ''; form['animal-weight'].value = item.peso || ''; form['animal-allergies'].value = item.alergias || ''; form['animal-notes'].value = item.obs || '';
    openModal('animal-modal');
  };

  window.editServico = async (id) => {
    const item = (await api.getServicos()).find(i => i.id === id); if (!item) return;
    const form = document.getElementById('servico-form');
    form['servico-id'].value = item.id || ''; form['servico-nome'].value = item.nome || ''; form['servico-preco'].value = item.preco || ''; form['servico-duracao'].value = item.duracao || ''; form['servico-descricao'].value = item.descricao || '';
    openModal('servico-modal');
  };

  window.editAgendamento = async (id) => {
    const item = (await api.getAgendamentos()).find(i => i.id === id); if (!item) return;
    const form = document.getElementById('agendamento-form');
    form['agendamento-id'].value = item.id || ''; form['agendamento-animal-id'].value = item.animalId || ''; form['agendamento-servico-id'].value = item.servicoId || ''; form['agendamento-data'].value = item.data || ''; form['agendamento-hora'].value = item.hora || ''; form['agendamento-status'].value = item.status || 'Agendado';
    openModal('agendamento-modal');
  };

  window.deleteAnimal = async (id) => { if (confirm('Tem certeza?')) { await api.deleteAnimal(id); await renderAll(); } };
  window.deleteServico = async (id) => { if (confirm('Tem certeza?')) { await api.deleteServico(id); await renderAll(); } };
  window.deleteAgendamento = async (id) => { if (confirm('Tem certeza?')) { await api.deleteAgendamento(id); await renderAll(); } };
  
  document.getElementById('save-user-btn').addEventListener('click', async () => {
    const form = document.getElementById('user-form');
    const userData = { email: form['user-email'].value, password: form['user-password'].value };
    if (!userData.email || !userData.password) { return alert("Preencha todos os campos."); }
    const saveBtn = document.getElementById('save-user-btn');
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    saveBtn.disabled = true;
    try {
        const result = await api.createUser(userData);
        if (result.User || result.success) {
            form.reset();
            closeModal(document.getElementById('user-modal'));
            await renderUsersView();
        } else {
            alert("Falha ao criar usuário: " + (result.message || "Erro desconhecido."));
        }
    } catch (error) {
        alert("Ocorreu um erro inesperado.");
    } finally {
        saveBtn.innerHTML = 'Salvar Usuário';
        saveBtn.disabled = false;
    }
  });

  window.deleteUser = async (id) => {
    // CORREÇÃO FINAL: O parâmetro aqui é o ID (que no caso é o username/email)
    if (confirm(`Tem certeza que deseja excluir o usuário ${id}?`)) {
        try {
            await api.deleteUser(id);
            await renderUsersView();
        } catch (error) {
            alert("Falha ao excluir usuário: " + (error.response?.data?.message || error.message));
        }
    }
  };
});