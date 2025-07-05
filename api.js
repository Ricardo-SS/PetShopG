// api.js

// 1. Configuração do AWS Amplify para conectar ao nosso backend na nuvem
// =====================================================================
const { Auth, API } = aws_amplify;

Auth.configure({
    // ID do seu Grupo de Usuários do Cognito
    userPoolId: 'us-east-1_3AXBtD9Ua',
    
    // ID do seu Cliente de Aplicativo do Cognito
    userPoolWebClientId: '2eo2kqvn1q8vmvilgupo3dot4o',
});

API.configure({
    endpoints: [
        {
            name: "PetCareAPI", // Nome que daremos à nossa API
            // Sua URL de invocação do API Gateway
            endpoint: "https://adjwk4bhq1.execute-api.us-east-1.amazonaws.com/v1",
            
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