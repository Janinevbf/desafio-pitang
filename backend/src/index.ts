import { app } from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(` Servidor em http://localhost:${PORT}`);
    console.log(`Teste o login enviando um POST para /auth/login`);
});