// api.js

// 1. Configuração do AWS Amplify
const { Auth, API } = aws_amplify;

Auth.configure({
    userPoolId: 'us-east-1_3AXBtD9Ua',
    userPoolWebClientId: '2eo2kqvn1q8vmvilgupo3dot4o',
});

API.configure({
    endpoints: [ {
        name: "PetCareAPI",
        endpoint: "https://api.ricardo.group-05.dev.ufersa.dev.br",
        custom_header: async () => {
            try { return { Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` } }
            catch(e) { return {} }
        }
    } ]
});

// 2. Objeto de Sessão
const session = {
    user: null,
    groups: [],
    isAdmin: () => session.groups.includes('admins'),
};

// 3. Funções de API
const api = {
    // --- Funções de Animais, Serviços, Agendamentos (permanecem as mesmas) ---
    getAnimais: async (searchParams = {}) => {
        try {
            const queryString = new URLSearchParams(searchParams).toString();
            const path = queryString ? `/items/animais?${queryString}` : '/items/animais';
            return await API.get('PetCareAPI', path);
        } catch (error) { console.error("Erro ao buscar animais:", error); return []; }
    },
    saveAnimal: async (data) => data.id ? await API.put('PetCareAPI', `/items/animais/${data.id}`, { body: data }) : await API.post('PetCareAPI', '/items/animais', { body: data }),
    deleteAnimal: async (id) => await API.del('PetCareAPI', `/items/animais/${id}`),
    getServicos: async () => { try { return await API.get('PetCareAPI', '/items/servicos'); } catch (error) { console.error("Erro ao buscar serviços:", error); return []; } },
    saveServico: async (data) => data.id ? await API.put('PetCareAPI', `/items/servicos/${data.id}`, { body: data }) : await API.post('PetCareAPI', '/items/servicos', { body: data }),
    deleteServico: async (id) => await API.del('PetCareAPI', `/items/servicos/${id}`),
    getAgendamentos: async () => { try { return await API.get('PetCareAPI', '/items/agendamentos'); } catch (error) { console.error("Erro ao buscar agendamentos:", error); return []; } },
    saveAgendamento: async (data) => data.id ? await API.put('PetCareAPI', `/items/agendamentos/${data.id}`, { body: data }) : await API.post('PetCareAPI', '/items/agendamentos', { body: data }),
    deleteAgendamento: async (id) => await API.del('PetCareAPI', `/items/agendamentos/${id}`),

    // --- SESSÃO E LOGIN/LOGOUT ---
    login: async (username, password) => {
        try {
            const user = await Auth.signIn(username, password);

            if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
                const newPassword = prompt("Você é um novo usuário. Por favor, defina sua senha permanente:");
                if (!newPassword) {
                    return { success: false, message: "A definição de nova senha foi cancelada." };
                }
                await Auth.completeNewPassword(user, newPassword);
            }
            
            const userSession = await Auth.currentSession();
            session.groups = userSession.getIdToken().payload['cognito:groups'] || [];
            session.user = await Auth.currentAuthenticatedUser();
            return { success: true };

        } catch (error) {
            console.error("Erro detalhado no login:", error);
            // CORREÇÃO APLICADA AQUI: Mostra a mensagem de erro mais específica disponível.
            const message = error.message || error.name || "Ocorreu um erro desconhecido.";
            return { success: false, message: `Erro: ${message}` };
        }
    },
    logout: async () => {
        try {
            await Auth.signOut();
            session.user = null;
            session.groups = [];
            return { success: true };
        } catch (error) { return { success: false, error }; }
    },
    checkAndLoadSession: async () => {
        try {
            session.user = await Auth.currentAuthenticatedUser();
            const userSession = await Auth.currentSession();
            session.groups = userSession.getIdToken().payload['cognito:groups'] || [];
            return true;
        } catch (e) {
            session.user = null;
            session.groups = [];
            return false;
        }
    },
    getSession: () => session,
    
    // --- USUÁRIOS (ADMIN) ---
    getUsers: async () => { try { return await API.get('PetCareAPI', '/admin/users'); } catch (error) { console.error("Erro ao buscar usuários:", error); return []; } },
    createUser: async (userData) => {
        try {
            const response = await API.post('PetCareAPI', '/admin/users', { body: userData });
            return { ...response, success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { success: false, message: errorMessage };
        }
    },
    saveUser: async (id, userData) => {
        try {
            const response = await API.put('PetCareAPI', `/admin/users/${id}`, { body: userData });
            return { ...response, success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { success: false, message: errorMessage };
        }
    },
    deleteUser: async (id) => await API.del('PetCareAPI', `/admin/users/${id}`),
};