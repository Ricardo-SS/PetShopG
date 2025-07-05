# CREDENCIAIS
login: admin
senha: Admin@123

# FUNÇAO LAMBDA

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableMap = {
    animais: 'petcare-animais',
    servicos: 'petcare-servicos',
    agendamentos: 'petcare-agendamentos'
};

export const handler = async (event) => {
    console.log("Evento Recebido: ", JSON.stringify(event));
    
    // Headers de CORS, essenciais para a resposta
    const headers = {
        "Access-Control-Allow-Origin": "*", // Em produção, restrinja ao seu domínio do Amplify
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    };

    // Responde a requisições pre-flight do CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers
        };
    }

    try {
        const method = event.httpMethod;
        
        // --- CORREÇÃO PRINCIPAL APLICADA AQUI ---
        // API REST envia parâmetros de caminho em `event.pathParameters`
        // Em vez de analisar a URL manualmente, vamos usar o objeto que a API Gateway já nos dá.
        
        const resourceType = event.pathParameters?.type; // Usando 'type' do caminho /items/{type}
        const id = event.pathParameters?.id;           // Usando 'id' do caminho /items/{type}/{id}
        
        const tableName = tableMap[resourceType];

        if (!tableName) {
            // Se resourceType for indefinido ou não estiver no mapa, retorna erro.
            // Isso acontece em chamadas para /items sem um {type}
            // Vamos tratar isso graciosamente. Se não for um tipo conhecido, não é um erro fatal.
             console.warn(`Tentativa de acesso a um recurso desconhecido ou caminho base: ${event.path}`);
             // Para uma chamada GET em /items (sem tipo), podemos retornar uma mensagem de boas-vindas.
             if (method === 'GET' && !resourceType) {
                 return {
                     statusCode: 200,
                     headers,
                     body: JSON.stringify({ message: "API PetCare ativa. Especifique um recurso como /items/animais." })
                 };
             }
            throw new Error(`Recurso inválido ou não especificado.`);
        }

        let responseBody;

        // Lógica do Switch Case (GET, POST, PUT, DELETE) - Sem alterações
        switch (method) {
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
                throw new Error(`Método HTTP não suportado: ${method}`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(responseBody),
        };

    } catch (error) {
        console.error("ERRO na Lambda:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Ocorreu um erro interno no servidor.", error: error.message }),
        };
    }
};