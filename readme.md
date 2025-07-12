# CREDENCIAIS
login: admin
senha: Admin@123

login: user
senha: User@123

# SITE
https://ricardo.group-05.dev.ufersa.dev.br/

# FUNÇAO LAMBDA

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from 'node:crypto'; // Importa a função específica

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Nome da tabela e chave primária confirmados
const TABLE_NAME = "users";

export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token"
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({ message: "CORS preflight successful" }),
        };
    }

    if (event.httpMethod === 'POST') {
        try {
            const body = JSON.parse(event.body);
            const { nome, endereco, telefone, email } = body;

            if (!nome || !endereco || !telefone || !email) {
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({ message: "Missing required fields (nome, endereco, telefone, email)" }),
                };
            }

            const userId = randomUUID(); // Usa a função diretamente
            const params = {
                TableName: TABLE_NAME,
                Item: {
                    id: userId, // para a chave primária "id"
                    nome: nome,
                    endereco: endereco,
                    telefone: telefone,
                    email: email,
                    createdAt: new Date().toISOString(),
                },
            };

            const command = new PutCommand(params);
            await docClient.send(command);

            return {
                statusCode: 201,
                headers: headers,
                body: JSON.stringify({ message: "User created successfully", userId: userId }),
            };

        } catch (error) {
            console.error("Error creating user:", error);
            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify({ message: "Failed to create user", error: error.message }),
            };
        }
    }

    if (event.httpMethod === 'GET') {
        try {
            const params = {
                TableName: TABLE_NAME,
                Select: "COUNT",
            };

            const command = new ScanCommand(params);
            const data = await docClient.send(command);

            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({ userCount: data.Count }),
            };

        } catch (error) {
            console.error("Error getting user count:", error);
            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify({ message: "Failed to get user count", error: error.message }),
            };
        }
    }

    return {
        statusCode: 405,
        headers: headers,
        body: JSON.stringify({ message: "Method Not Allowed" }),
    };
};