Class Diary

O Class Diary é uma aplicação para professores gerirem digitalmente as suas turmas e realizarem o controlo de presença de forma rápida e organizada.

Funcionalidades

👨‍🏫 Perfil do Professor

* Registo do nome do professor.
* Definição da disciplina.
* Organização das informações por professor.

🏫 Gestão de Turmas

* Criação de turmas.
* Visualização das turmas.
* Organização dos alunos por turma.

👨‍🎓 Gestão de Alunos

* Adição de alunos.
* Visualização da lista de alunos.
* Pesquisa de alunos.
* Identificação individual dos estudantes.

✅ Controlo de Presença

* Início de uma chamada.
* Registro de aluno presente.
* Registro de ausência.
* Registro de atraso.
* Registro de falta justificada.
* Avanço rápido entre os alunos.
* Finalização da chamada.

📋 Histórico

* Consulta das chamadas realizadas.
* Visualização dos registros de presença.
* Acompanhamento do histórico dos alunos.

📊 Acompanhamento

* Resumo da presença da turma.
* Visualização de faltas e atrasos.
* Consulta rápida da situação de cada aluno.

💾 Persistência

* Salvamento dos registros realizados.
* Preservação dos dados entre sessões.

Objetivo

O Class Diary foi criado para substituir o processo manual de chamada e tornar o acompanhamento das turmas mais rápido, simples e organizado.

Menos tempo a fazer a chamada. Mais tempo para ensinar.



# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
