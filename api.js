// // api.js

// // Este objeto 'db' funcionará como banco de dados em memória.
// // Ele será populado na inicialização com os dados dos arquivos JSON.
// const db = {
//   animais: [],
//   servicos: [],
//   agendamentos: []
// };

// // --- FUNÇÃO DE INICIALIZAÇÃO ---
// // Lê os arquivos JSON e carrega os dados no nosso banco de dados em memória.
// // Em uma aplicação real com AWS, esta etapa não existiria.
// async function initDatabase() {
//   try {
//       const [animaisRes, servicosRes, agendamentosRes] = await Promise.all([
//           fetch('./data/animais.json'),
//           fetch('./data/servicos.json'),
//           fetch('./data/agendamentos.json')
//       ]);
//       db.animais = await animaisRes.json();
//       db.servicos = await servicosRes.json();
//       db.agendamentos = await agendamentosRes.json();
//       console.log("Banco de dados em memória inicializado a partir dos arquivos JSON.");
//   } catch (error) {
//       console.error("Falha ao carregar dados dos arquivos JSON:", error);
//   }
// }

// // --- FUNÇÕES DE API ---
// // Cada função aqui simula uma chamada de API.
// // Elas estão prontas para serem substituídas pelas chamadas reais do AWS Amplify.

// const api = {
//   // --- ANIMAIS ---
//   getAnimais: async () => {
//       console.log("API: Buscando animais...");
//       // Simulação com JSON em memória
//       return [...db.animais];

//       /*
//       // CÓDIGO PARA MIGRAÇÃO AWS (descomentar após configurar o backend)
//       // try {
//       //     return await API.get('PetCareAPI', '/items/animais');
//       // } catch (error) {
//       //     console.error("Erro ao buscar animais na AWS:", error);
//       //     return [];
//       // }
//       */
//   },

//   saveAnimal: async (animalData) => {
//       console.log("API: Salvando animal...", animalData);
//       // Simulação com JSON em memória
//       if (animalData.id) { // Atualização
//           const index = db.animais.findIndex(a => a.id == animalData.id);
//           if (index !== -1) db.animais[index] = animalData;
//       } else { // Criação
//           animalData.id = Date.now(); // Gera um ID simples
//           db.animais.push(animalData);
//       }
//       return animalData;

//       /*
//       // CÓDIGO PARA MIGRAÇÃO AWS
//       // if (animalData.id) { // PUT para atualizar
//       //     return await API.put('PetCareAPI', `/items/animais/${animalData.id}`, { body: animalData });
//       // } else { // POST para criar
//       //     return await API.post('PetCareAPI', '/items/animais', { body: animalData });
//       // }
//       */
//   },

//   deleteAnimal: async (id) => {
//       console.log("API: Deletando animal...", id);
//       // Simulação com JSON em memória
//       db.animais = db.animais.filter(a => a.id != id);
//       // Também deleta agendamentos associados
//       db.agendamentos = db.agendamentos.filter(ag => ag.animalId != id);
//       return { message: "Deletado com sucesso" };

//       /*
//       // CÓDIGO PARA MIGRAÇÃO AWS
//       // return await API.del('PetCareAPI', `/items/animais/${id}`);
//       // A lógica de deletar agendamentos em cascata deveria ser feita no backend (Lambda).
//       */
//   },

//   // --- SERVIÇOS ---
//   getServicos: async () => {
//       console.log("API: Buscando serviços...");
//       return [...db.servicos];
//       /* CÓDIGO PARA MIGRAÇÃO AWS: return await API.get('PetCareAPI', '/items/servicos'); */
//   },
//   saveServico: async (servicoData) => {
//       console.log("API: Salvando serviço...", servicoData);
//       if (servicoData.id) {
//           const index = db.servicos.findIndex(s => s.id == servicoData.id);
//           if (index !== -1) db.servicos[index] = servicoData;
//       } else {
//           servicoData.id = Date.now();
//           db.servicos.push(servicoData);
//       }
//       return servicoData;
//       /* CÓDIGO PARA MIGRAÇÃO AWS: (similar ao saveAnimal) */
//   },
//   deleteServico: async (id) => {
//       console.log("API: Deletando serviço...", id);
//       db.servicos = db.servicos.filter(s => s.id != id);
//       return { message: "Deletado com sucesso" };
//       /* CÓDIGO PARA MIGRAÇÃO AWS: return await API.del('PetCareAPI', `/items/servicos/${id}`); */
//   },

//   // --- AGENDAMENTOS ---
//   getAgendamentos: async () => {
//       console.log("API: Buscando agendamentos...");
//       return [...db.agendamentos];
//       /* CÓDIGO PARA MIGRAÇÃO AWS: return await API.get('PetCareAPI', '/items/agendamentos'); */
//   },
//   saveAgendamento: async (agendamentoData) => {
//       console.log("API: Salvando agendamento...", agendamentoData);
//       if (agendamentoData.id) {
//           const index = db.agendamentos.findIndex(ag => ag.id == agendamentoData.id);
//           if (index !== -1) db.agendamentos[index] = agendamentoData;
//       } else {
//           agendamentoData.id = Date.now();
//           db.agendamentos.push(agendamentoData);
//       }
//       return agendamentoData;
//       /* CÓDIGO PARA MIGRAÇÃO AWS: (similar ao saveAnimal) */
//   },
//   deleteAgendamento: async (id) => {
//       console.log("API: Deletando agendamento...", id);
//       db.agendamentos = db.agendamentos.filter(ag => ag.id != id);
//       return { message: "Deletado com sucesso" };
//       /* CÓDIGO PARA MIGRAÇÃO AWS: return await API.del('PetCareAPI', `/items/agendamentos/${id}`); */
//   },

//   // --- LOGIN ---
//   login: async (username, password) => {
//       // Esta função simula o login. Em um cenário real, ela chamaria a API de autenticação.
//       console.log(`Simulando login para usuário: ${username}`);
//       if (username === 'admin' && password === '123') {
//           return { success: true };
//       }
//       return { success: false, message: "Credenciais inválidas" };
      
//       /*
//       // CÓDIGO PARA MIGRAÇÃO AWS
//       // try {
//       //     const user = await Auth.signIn(username, password);
//       //     return { success: true, user };
//       // } catch (error) {
//       //     return { success: false, message: error.message };
//       // }
//       */
//   }
// };

// // Inicializa o banco de dados assim que o script é carregado
// initDatabase();

// api.js

// 1. Configuração do AWS Amplify para conectar ao nosso backend na nuvem
// =====================================================================
const { Auth, API } = aws_amplify;

Auth.configure({
    // Cole o ID do seu Grupo de Usuários do Cognito aqui
    userPoolId: 'us-east-1_3AXBtD9Ua', // OBRIGATÓRIO 
    
    // Cole o ID do seu Cliente de Aplicativo do Cognito aqui
    userPoolWebClientId: '2eo2kqvn1q8vmvilgupo3dot4o', // OBRIGATÓRIO
});

API.configure({
    endpoints: [
        {
            name: "PetCareAPI", // Nome que daremos à nossa API
            // Sua URL de invocação do API Gateway que você forneceu
            endpoint: "https://adjwk4bhq1.execute-api.us-east-1.amazonaws.com/v1", // CORRETO
            
            // Esta função anexa automaticamente o token de autenticação em cada chamada para a API
            custom_header: async () => { 
                try {
                    // Pega a sessão do usuário logado e retorna o cabeçalho de autorização
                    return { Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
                } catch (e) {
                    console.warn("Não foi possível obter a sessão do usuário. A chamada será feita sem token.", e);
                    // Se não houver usuário logado, não envia o cabeçalho de autorização
                    return {};
                }
            }
        }
    ]
});


// 2. Funções de API que agora conversam com a AWS
// ===============================================
// Note que removemos o objeto 'db' e a função 'initDatabase'. Eles não são mais necessários
// pois nossos dados agora vivem no DynamoDB na nuvem.

const api = {
    // --- ANIMAIS ---
    getAnimais: async () => {
        try {
            return await API.get('PetCareAPI', '/items/animais');
        } catch (error) {
            console.error("Erro ao buscar animais na AWS:", error);
            return []; // Retorna um array vazio em caso de erro
        }
    },

    saveAnimal: async (animalData) => {
        if (animalData.id) { // Se tem ID, atualiza (PUT)
            return await API.put('PetCareAPI', `/items/animais/${animalData.id}`, { body: animalData });
        } else { // Se não tem ID, cria um novo (POST)
            return await API.post('PetCareAPI', '/items/animais', { body: animalData });
        }
    },

    deleteAnimal: async (id) => {
        // A lógica de deletar agendamentos em cascata agora é feita no backend (Lambda)
        return await API.del('PetCareAPI', `/items/animais/${id}`);
    },

    // --- SERVIÇOS ---
    getServicos: async () => {
        try {
            return await API.get('PetCareAPI', '/items/servicos');
        } catch (error) {
            console.error("Erro ao buscar serviços na AWS:", error);
            return [];
        }
    },
    saveServico: async (servicoData) => {
        if (servicoData.id) {
            return await API.put('PetCareAPI', `/items/servicos/${servicoData.id}`, { body: servicoData });
        } else {
            return await API.post('PetCareAPI', '/items/servicos', { body: servicoData });
        }
    },
    deleteServico: async (id) => {
        return await API.del('PetCareAPI', `/items/servicos/${id}`);
    },

    // --- AGENDAMENTOS ---
    getAgendamentos: async () => {
        try {
            return await API.get('PetCareAPI', '/items/agendamentos');
        } catch (error) {
            console.error("Erro ao buscar agendamentos na AWS:", error);
            return [];
        }
    },
    saveAgendamento: async (agendamentoData) => {
        if (agendamentoData.id) {
            return await API.put('PetCareAPI', `/items/agendamentos/${agendamentoData.id}`, { body: agendamentoData });
        } else {
            return await API.post('PetCareAPI', '/items/agendamentos', { body: agendamentoData });
        }
    },
    deleteAgendamento: async (id) => {
        return await API.del('PetCareAPI', `/items/agendamentos/${id}`);
    },

    // --- LOGIN ---
    login: async (username, password) => {
        try {
            // Usa o serviço de autenticação real do Cognito
            const user = await Auth.signIn(username, password);
            return { success: true, user };
        } catch (error) {
            console.error("Erro no login:", error);
            return { success: false, message: `Erro: ${error.message}` };
        }
    }
};