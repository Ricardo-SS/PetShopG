# CREDENCIAIS
login: admin
senha: Admin@123

# SITE
https://ricardo.group-05.dev.ufersa.dev.br/

# FUNÇAO LAMBDA
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, AdminCreateUserCommand, ListUsersCommand, AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { randomUUID } from "crypto";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const cognitoClient = new CognitoIdentityProviderClient({});

const tableMap = {
    animais: 'petcare-animais',
    servicos: 'petcare-servicos',
    agendamentos: 'petcare-agendamentos'
};
const USER_POOL_ID = process.env.USER_POOL_ID;

export const handler = async (event) => {
    console.log("Evento Recebido: ", JSON.stringify(event));
    
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    try {
        let responseBody;
        const path = event.path;
        const httpMethod = event.httpMethod;

        if (path.startsWith('/admin/users')) {
            const userId = event.pathParameters?.id; 

            switch (httpMethod) {
                case 'GET':
                    const listUsersCommand = new ListUsersCommand({ UserPoolId: USER_POOL_ID });
                    const { Users } = await cognitoClient.send(listUsersCommand);
                    // AQUI GARANTIMOS O FORMATO CORRETO DO DADO
                    responseBody = Users.map(user => ({
                        id: user.Username, // Cria a propriedade 'id'
                        email: user.Attributes.find(attr => attr.Name === 'email').Value,
                        role: 'Funcionário', // Lógica de role pode ser expandida aqui
                        createdAt: user.UserCreateDate
                    }));
                    break;
                case 'POST':
                    const { email, password } = JSON.parse(event.body);
                    const createUserCommand = new AdminCreateUserCommand({
                        UserPoolId: USER_POOL_ID,
                        Username: email,
                        TemporaryPassword: password,
                        UserAttributes: [{ Name: "email", Value: email }, { Name: "email_verified", Value: "true" }],
                        MessageAction: "SUPPRESS"
                    });
                    const createdUser = await cognitoClient.send(createUserCommand);
                    responseBody = { success: true, user: createdUser.User };
                    break;
                case 'DELETE':
                    if (!userId) throw new Error("ID do usuário (username) é necessário para exclusão.");
                    const deleteUserCommand = new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: userId });
                    await cognitoClient.send(deleteUserCommand);
                    responseBody = { success: true, message: `Usuário ${userId} excluído com sucesso.` };
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
                    if (id) {
                        const command = new GetCommand({ TableName: tableName, Key: { id } });
                        const { Item } = await docClient.send(command);
                        responseBody = Item || { message: "Item não encontrado" };
                    } else {
                        const command = new ScanCommand({ TableName: tableName });
                        const { Items } = await docClient.send(command);
                        responseBody = Items;
                    }
                    break;
                case 'POST':
                    const itemDataToCreate = JSON.parse(event.body);
                    itemDataToCreate.id = randomUUID();
                    const createCommand = new PutCommand({ TableName: tableName, Item: itemDataToCreate });
                    await docClient.send(createCommand);
                    responseBody = itemDataToCreate;
                    break;
                case 'PUT':
                    if (!id) throw new Error("ID é necessário para atualização (PUT)");
                    const itemDataToUpdate = JSON.parse(event.body);
                    itemDataToUpdate.id = id;
                    const updateCommand = new PutCommand({ TableName: tableName, Item: itemDataToUpdate });
                    await docClient.send(updateCommand);
                    responseBody = itemDataToUpdate;
                    break;
                case 'DELETE':
                     if (!id) throw new Error("ID é necessário para exclusão (DELETE)");
                    const deleteCommand = new DeleteCommand({ TableName: tableName, Key: { id } });
                    await docClient.send(deleteCommand);
                    responseBody = { message: `Item ${id} excluído com sucesso.` };
                    break;
                default:
                    throw new Error(`Método HTTP não suportado: ${httpMethod}`);
            }
        } else {
            throw new Error(`Caminho não reconhecido: ${path}`);
        }

        return { statusCode: 200, headers, body: JSON.stringify(responseBody) };

    } catch (error) {
        console.error("ERRO DETALHADO na Lambda:", error);
        let statusCode = 400;
        let message = "Ocorreu um erro ao processar sua solicitação.";
        
        if (error.name === 'UsernameExistsException') {
            statusCode = 409;
            message = "Este e-mail de usuário já está cadastrado.";
        } else if (error.name === 'InvalidPasswordException') {
            statusCode = 400;
            message = "A senha não atende aos requisitos de segurança.";
        } else if (error.name === 'UserNotFoundException') {
            statusCode = 404;
            message = "Usuário não encontrado.";
        }

        return { statusCode, headers, body: JSON.stringify({ message }) };
    }
};
