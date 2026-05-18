# helpp-backend

Servidor backend do projeto **Helpp** — conectando pessoas que precisam de ajuda com quem pode ajudar.

## Stack

- [Express 5](https://expressjs.com/) — servidor HTTP
- [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose](https://mongoosejs.com/) — banco de dados
- [JWT](https://jwt.io/) — autenticação (access token 15min + refresh token 30d)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — hash de senhas

## Configuração

Crie um arquivo `.env` na raiz com as seguintes variáveis:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/helpp?appName=Cluster0
JWT_SECRET=sua_chave_secreta
JWT_REFRESH_SECRET=sua_chave_refresh_secreta
```

## Executando

```bash
npm install
npm run dev
# Servidor rodando em http://localhost:3000
```

## Documentação da API

Acesse a documentação interativa (Swagger UI) em:

```
http://localhost:3000/docs
```

## Endpoints utilitários

| Método | URL | Descrição |
|--------|-----|-----------|
| GET | `/health` | Verifica se o servidor está no ar |
| GET | `/version` | Retorna a versão exata da API em execução |

Exemplo de resposta do `/version`:

```json
{
  "name": "helpp-backend",
  "version": "1.0.0",
  "node": "v20.11.0",
  "env": "development"
}
```
