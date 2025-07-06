const { Auth, API } = aws_amplify;

Auth.configure({
  userPoolId: "us-east-1_3AXBtD9Ua",
  userPoolWebClientId: "2eo2kqvn1q8vmvilgupo3dot4o",
});
API.configure({
  endpoints: [
    {
      name: "PetCareAPI",
      endpoint: "https://adjwk4bhq1.execute-api.us-east-1.amazonaws.com/v1",
      // endpoint: "https://api.ricardo.group-05.dev.ufersa.dev.br",
      
      custom_header: async () => {
        try {
          return {
            Authorization: `Bearer ${(await Auth.currentSession())
              .getIdToken()
              .getJwtToken()}`,
          };
        } catch (e) {
          return {};
        }
      },
    },
  ],
});

const session = {
  user: null,
  groups: [],
  isAdmin: () => session.groups.includes("admins"),
};

const api = {
  getAnimais: async () => {
    try {
      return await API.get("PetCareAPI", "/items/animais");
    } catch (error) {
      console.error("Erro ao buscar animais:", error);
      return [];
    }
  },
  saveAnimal: async (data) =>
    data.id
      ? await API.put("PetCareAPI", `/items/animais/${data.id}`, { body: data })
      : await API.post("PetCareAPI", "/items/animais", { body: data }),
  deleteAnimal: async (id) =>
    await API.del("PetCareAPI", `/items/animais/${id}`),
  getServicos: async () => {
    try {
      return await API.get("PetCareAPI", "/items/servicos");
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      return [];
    }
  },
  saveServico: async (data) =>
    data.id
      ? await API.put("PetCareAPI", `/items/servicos/${data.id}`, {
          body: data,
        })
      : await API.post("PetCareAPI", "/items/servicos", { body: data }),
  deleteServico: async (id) =>
    await API.del("PetCareAPI", `/items/servicos/${id}`),
  getAgendamentos: async () => {
    try {
      return await API.get("PetCareAPI", "/items/agendamentos");
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      return [];
    }
  },
  saveAgendamento: async (data) =>
    data.id
      ? await API.put("PetCareAPI", `/items/agendamentos/${data.id}`, {
          body: data,
        })
      : await API.post("PetCareAPI", "/items/agendamentos", { body: data }),
  deleteAgendamento: async (id) =>
    await API.del("PetCareAPI", `/items/agendamentos/${id}`),

  login: async (username, password) => {
    try {
      session.user = await Auth.signIn(username, password);
      const userSession = await Auth.currentSession();
      session.groups = userSession.getIdToken().payload["cognito:groups"] || [];
      return { success: true };
    } catch (error) {
      return { success: false, message: `Erro: ${error.message}` };
    }
  },
  logout: async () => {
    try {
      await Auth.signOut();
      session.user = null;
      session.groups = [];
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },
  getSession: () => session,

  getUsers: async () => {
    try {
      return await API.get("PetCareAPI", "/admin/users");
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  },
  createUser: async (userData) => {
    try {
      return await API.post("PetCareAPI", "/admin/users", { body: userData });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      return { success: false, message: errorMessage };
    }
  },

  // Adicione esta função dentro do objeto 'api' no seu api.js

    checkAndLoadSession: async () => {
        try {
            // Tenta obter o usuário autenticado atual. Se falhar, vai para o catch.
            session.user = await Auth.currentAuthenticatedUser();
            
            // Se funcionou, pega os dados da sessão (incluindo os grupos de admin)
            const userSession = await Auth.currentSession();
            session.groups = userSession.getIdToken().payload['cognito:groups'] || [];
            
            return true; // Retorna true se houver uma sessão válida
        } catch (e) {
            // Se não houver sessão, limpa os dados locais e retorna false
            session.user = null;
            session.groups = [];
            return false;
        }
    },
    
  deleteUser: async (id) => await API.del("PetCareAPI", `/admin/users/${id}`),
};
