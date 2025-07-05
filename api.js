// api.js

// Este objeto 'db' funcionará como nosso banco de dados em memória.
// Ele será populado na inicialização com os dados dos arquivos JSON.
const db = {
  animais: [],
  servicos: [],
  agendamentos: []
};

// --- FUNÇÃO DE INICIALIZAÇÃO ---
// Lê os arquivos JSON e carrega os dados no nosso banco de dados em memória.
// Em uma aplicação real com AWS, esta etapa não existiria.
async function initDatabase() {
  try {
      const [animaisRes, servicosRes, agendamentosRes] = await Promise.all([
          fetch('./data/animais.json'),
          fetch('./data/servicos.json'),
          fetch('./data/agendamentos.json')
      ]);
      db.animais = await animaisRes.json();
      db.servicos = await servicosRes.json();
      db.agendamentos = await agendamentosRes.json();
      console.log("Banco de dados em memória inicializado a partir dos arquivos JSON.");
  } catch (error) {
      console.error("Falha ao carregar dados dos arquivos JSON:", error);
  }
}

// --- FUNÇÕES DE API ---
// Cada função aqui simula uma chamada de API.
// Elas estão prontas para serem substituídas pelas chamadas reais do AWS Amplify.

const api = {
  // --- ANIMAIS ---
  getAnimais: async () => {
      console.log("API: Buscando animais...");
      // Simulação com JSON em memória
      return [...db.animais];

      /*
      // CÓDIGO PARA MIGRAÇÃO AWS (descomentar após configurar o backend)
      // try {
      //     return await API.get('PetCareAPI', '/items/animais');
      // } catch (error) {
      //     console.error("Erro ao buscar animais na AWS:", error);
      //     return [];
      // }
      */
  },

  saveAnimal: async (animalData) => {
      console.log("API: Salvando animal...", animalData);
      // Simulação com JSON em memória
      if (animalData.id) { // Atualização
          const index = db.animais.findIndex(a => a.id == animalData.id);
          if (index !== -1) db.animais[index] = animalData;
      } else { // Criação
          animalData.id = Date.now(); // Gera um ID simples
          db.animais.push(animalData);
      }
      return animalData;

      /*
      // CÓDIGO PARA MIGRAÇÃO AWS
      // if (animalData.id) { // PUT para atualizar
      //     return await API.put('PetCareAPI', `/items/animais/${animalData.id}`, { body: animalData });
      // } else { // POST para criar
      //     return await API.post('PetCareAPI', '/items/animais', { body: animalData });
      // }
      */
  },

  deleteAnimal: async (id) => {
      console.log("API: Deletando animal...", id);
      // Simulação com JSON em memória
      db.animais = db.animais.filter(a => a.id != id);
      // Também deleta agendamentos associados
      db.agendamentos = db.agendamentos.filter(ag => ag.animalId != id);
      return { message: "Deletado com sucesso" };

      /*
      // CÓDIGO PARA MIGRAÇÃO AWS
      // return await API.del('PetCareAPI', `/items/animais/${id}`);
      // A lógica de deletar agendamentos em cascata deveria ser feita no backend (Lambda).
      */
  },

  // --- SERVIÇOS ---
  getServicos: async () => {
      console.log("API: Buscando serviços...");
      return [...db.servicos];
      /* CÓDIGO PARA MIGRAÇÃO AWS: return await API.get('PetCareAPI', '/items/servicos'); */
  },
  saveServico: async (servicoData) => {
      console.log("API: Salvando serviço...", servicoData);
      if (servicoData.id) {
          const index = db.servicos.findIndex(s => s.id == servicoData.id);
          if (index !== -1) db.servicos[index] = servicoData;
      } else {
          servicoData.id = Date.now();
          db.servicos.push(servicoData);
      }
      return servicoData;
      /* CÓDIGO PARA MIGRAÇÃO AWS: (similar ao saveAnimal) */
  },
  deleteServico: async (id) => {
      console.log("API: Deletando serviço...", id);
      db.servicos = db.servicos.filter(s => s.id != id);
      return { message: "Deletado com sucesso" };
      /* CÓDIGO PARA MIGRAÇÃO AWS: return await API.del('PetCareAPI', `/items/servicos/${id}`); */
  },

  // --- AGENDAMENTOS ---
  getAgendamentos: async () => {
      console.log("API: Buscando agendamentos...");
      return [...db.agendamentos];
      /* CÓDIGO PARA MIGRAÇÃO AWS: return await API.get('PetCareAPI', '/items/agendamentos'); */
  },
  saveAgendamento: async (agendamentoData) => {
      console.log("API: Salvando agendamento...", agendamentoData);
      if (agendamentoData.id) {
          const index = db.agendamentos.findIndex(ag => ag.id == agendamentoData.id);
          if (index !== -1) db.agendamentos[index] = agendamentoData;
      } else {
          agendamentoData.id = Date.now();
          db.agendamentos.push(agendamentoData);
      }
      return agendamentoData;
      /* CÓDIGO PARA MIGRAÇÃO AWS: (similar ao saveAnimal) */
  },
  deleteAgendamento: async (id) => {
      console.log("API: Deletando agendamento...", id);
      db.agendamentos = db.agendamentos.filter(ag => ag.id != id);
      return { message: "Deletado com sucesso" };
      /* CÓDIGO PARA MIGRAÇÃO AWS: return await API.del('PetCareAPI', `/items/agendamentos/${id}`); */
  },

  // --- LOGIN ---
  login: async (username, password) => {
      // Esta função simula o login. Em um cenário real, ela chamaria a API de autenticação.
      console.log(`Simulando login para usuário: ${username}`);
      if (username === 'admin' && password === '123') {
          return { success: true };
      }
      return { success: false, message: "Credenciais inválidas" };
      
      /*
      // CÓDIGO PARA MIGRAÇÃO AWS
      // try {
      //     const user = await Auth.signIn(username, password);
      //     return { success: true, user };
      // } catch (error) {
      //     return { success: false, message: error.message };
      // }
      */
  }
};

// Inicializa o banco de dados assim que o script é carregado
initDatabase();