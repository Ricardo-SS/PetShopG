# CREDENCIAIS
## Admin
login: admin
senha: Admin@123
## Usuarios
login: user1@email.com
senha: User@1234

# SITE
https://ricardo.group-05.dev.ufersa.dev.br/

# FUNÇAO LAMBDA

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, AdminCreateUserCommand, ListUsersCommand, AdminDeleteUserCommand, AdminUpdateUserAttributesCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, ListUsersInGroupCommand } from "@aws-sdk/client-cognito-identity-provider";
import { randomUUID } from "crypto";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const cognitoClient = new CognitoIdentityProviderClient({});

const tableMap = { animais: 'petcare-animais', servicos: 'petcare-servicos', agendamentos: 'petcare-agendamentos' };
const USER_POOL_ID = process.env.USER_POOL_ID;

// --- FUNÇÃO ADICIONADA ---
// Helper para normalizar strings: converte para minúsculas e remove acentos.
const normalizeString = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const handler = async (event) => {
    console.log("Evento Recebido: ", JSON.stringify(event));
    const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS" };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

    try {
        let responseBody;
        const path = event.path;
        const httpMethod = event.httpMethod;

        if (path.startsWith('/admin/users')) {
            const userId = event.pathParameters?.id;

            switch (httpMethod) {
                case 'GET':
                    const [listUsersResult, adminsInGroupResult] = await Promise.all([
                        cognitoClient.send(new ListUsersCommand({ UserPoolId: USER_POOL_ID })),
                        cognitoClient.send(new ListUsersInGroupCommand({ UserPoolId: USER_POOL_ID, GroupName: 'admins' }))
                    ]);
                    
                    const adminUsernames = new Set(adminsInGroupResult.Users.map(u => u.Username));

                    responseBody = listUsersResult.Users.map(user => ({
                        Username: user.Username,
                        email: user.Attributes.find(a => a.Name === 'email')?.Value || '',
                        name: user.Attributes.find(a => a.Name === 'name')?.Value || '',
                        funcao: user.Attributes.find(a => a.Name === 'custom:funcao')?.Value || 'N/A',
                        isAdmin: adminUsernames.has(user.Username),
                    }));
                    break;
                case 'POST':
                    const { email, password, name, funcao, isAdmin } = JSON.parse(event.body);
                    const userAttrs = [
                        { Name: "email", Value: email }, { Name: "email_verified", Value: "true" },
                        { Name: "name", Value: name }, { Name: "custom:funcao", Value: funcao }
                    ];
                    await cognitoClient.send(new AdminCreateUserCommand({ UserPoolId: USER_POOL_ID, Username: email, TemporaryPassword: password, UserAttributes: userAttrs, MessageAction: "SUPPRESS" }));
                    if (isAdmin) {
                        await cognitoClient.send(new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: email, GroupName: 'admins' }));
                    }
                    responseBody = { success: true };
                    break;
                case 'PUT':
                    if (!userId) throw new Error("ID do usuário é necessário para edição.");
                    const updateData = JSON.parse(event.body);
                    await cognitoClient.send(new AdminUpdateUserAttributesCommand({ UserPoolId: USER_POOL_ID, Username: userId, UserAttributes: [ { Name: "name", Value: updateData.name }, { Name: "custom:funcao", Value: updateData.funcao } ] }));
                    if (updateData.isAdmin) {
                        await cognitoClient.send(new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: userId, GroupName: 'admins' }));
                    } else if (userId.toLowerCase() !== 'admin') {
                        await cognitoClient.send(new AdminRemoveUserFromGroupCommand({ UserPoolId: USER_POOL_ID, Username: userId, GroupName: 'admins' }));
                    }
                    responseBody = { success: true };
                    break;
                case 'DELETE':
                    if (!userId) throw new Error("ID do usuário é necessário para exclusão.");
                    if (userId.toLowerCase() === 'admin') throw new Error("O usuário 'admin' principal não pode ser excluído.");
                    await cognitoClient.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: userId }));
                    responseBody = { success: true, message: `Usuário ${userId} excluído.` };
                    break;
                default:
                    throw new Error(`Método ${httpMethod} não suportado para ${path}`);
            }
        } else if (path.startsWith('/items/')) {
            const resourceType = event.pathParameters?.type;
            const id = event.pathParameters?.id;
            const tableName = tableMap[resourceType];
            if (!tableName) throw new Error(`Recurso inválido: '${resourceType}'`);
            
            switch (httpMethod) {
                case 'GET':
                    const queryParams = event.queryStringParameters || {};
                    // --- LÓGICA DE BUSCA CORRIGIDA ---
                    // A busca insensível só se aplica à tabela de animais e se o parâmetro 'search' existir.
                    if (queryParams.search && tableName === 'petcare-animais') {
                        const normalizedSearchTerm = normalizeString(queryParams.search);
                        const scanParams = {
                            TableName: tableName,
                            FilterExpression: "contains(#nome_norm, :search) or contains(#tutor_norm, :search)",
                            ExpressionAttributeNames: {
                                "#nome_norm": "nome_normalizado",
                                "#tutor_norm": "tutor_normalizado"
                            },
                            ExpressionAttributeValues: {
                                ":search": normalizedSearchTerm
                            }
                        };
                        const { Items } = await docClient.send(new ScanCommand(scanParams));
                        responseBody = Items;
                    } else if (id) {
                        const { Item } = await docClient.send(new GetCommand({ TableName: tableName, Key: { id } }));
                        responseBody = Item || { message: "Item não encontrado" };
                    } else {
                        const { Items } = await docClient.send(new ScanCommand({ TableName: tableName }));
                        responseBody = Items;
                    }
                    break;
                case 'POST':
                case 'PUT':
                     const itemData = JSON.parse(event.body);
                     if (httpMethod === 'POST') itemData.id = randomUUID();
                     else itemData.id = id;

                     // --- LÓGICA DE NORMALIZAÇÃO ADICIONADA ---
                     // Se for um animal, cria/atualiza os campos normalizados para a busca.
                     if (tableName === 'petcare-animais') {
                         if (itemData.nome) itemData.nome_normalizado = normalizeString(itemData.nome);
                         if (itemData.tutor) itemData.tutor_normalizado = normalizeString(itemData.tutor);
                     }

                     await docClient.send(new PutCommand({ TableName: tableName, Item: itemData }));
                     responseBody = itemData;
                     break;
                case 'DELETE':
                     if (!id) throw new Error("ID é necessário para exclusão.");
                    await docClient.send(new DeleteCommand({ TableName: tableName, Key: { id } }));
                    responseBody = { message: `Item ${id} excluído.` };
                    break;
            }
        } else {
            throw new Error(`Caminho não reconhecido: ${path}`);
        }

        return { statusCode: 200, headers, body: JSON.stringify(responseBody) };

    } catch (error) {
        console.error("ERRO DETALHADO na Lambda:", error);
        let statusCode = 400;
        let message = error.message || "Ocorreu um erro ao processar sua solicitação.";
        if (error.name === 'UsernameExistsException') { statusCode = 409; message = "Este e-mail já está cadastrado."; }
        else if (error.name === 'InvalidPasswordException') { message = "A senha não atende aos requisitos de segurança."; }
        else if (error.name === 'UserNotFoundException') { statusCode = 404; message = "Usuário não encontrado."; }
        return { statusCode, headers, body: JSON.stringify({ message }) };
    }
};