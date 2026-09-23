Class Diary

Aplicação para gestão de turmas e controlo digital de presença.

📖 Sobre

O Class Diary é uma aplicação desenvolvida para professores gerirem as suas turmas e realizarem o controlo de presença de forma rápida, simples e organizada.

A aplicação substitui o processo tradicional de chamada em papel, permitindo manter os registros dos alunos e o histórico das aulas em um único lugar.

✨ Funcionalidades

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
* Registo de alunos presentes.
* Registo de ausências.
* Registo de atrasos.
* Registo de faltas justificadas.
* Avanço rápido entre os alunos.
* Finalização da chamada.

📋 Histórico

* Consulta das chamadas realizadas.
* Visualização dos registos de presença.
* Acompanhamento do histórico dos alunos.

📊 Acompanhamento

* Resumo da presença da turma.
* Visualização de faltas e atrasos.
* Consulta rápida da situação de cada aluno.

💾 Persistência

* Salvamento dos registos realizados.
* Preservação dos dados entre sessões.

🎯 Objetivo

O Class Diary foi criado para substituir o processo manual de chamada e tornar o acompanhamento das turmas mais rápido, simples e organizado.

Menos tempo a fazer a chamada. Mais tempo para ensinar.

⸻

🛠️ Tecnologias

* React
* TypeScript
* Vite

⸻

🚀 Desenvolvimento

Este projeto utiliza React + TypeScript + Vite.

O Vite fornece um ambiente de desenvolvimento rápido com HMR (Hot Module Replacement) e configuração inicial de ESLint.

Plugins React

Atualmente, o projeto pode utilizar um dos seguintes plugins oficiais:

* @vitejs/plugin-react — utiliza Oxc.
* @vitejs/plugin-react-swc — utiliza SWC.

React Compiler

O React Compiler não está habilitado por padrão neste projeto devido ao impacto que pode ter no desempenho de desenvolvimento e build.

Para habilitá-lo, consulte a documentação oficial do React.

⸻

🔍 ESLint

Para aplicações destinadas a produção, recomenda-se configurar o ESLint com regras type-aware.

Exemplo:

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      // Para regras mais rigorosas:
      // tseslint.configs.strictTypeChecked,
      // Para regras de estilo:
      // tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])

Também é possível utilizar:

* eslint-plugin-react-x
* eslint-plugin-react-dom

para adicionar regras específicas para aplicações React.

⸻

📁 Estrutura

class-diary/
├── src/
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
└── README.md

⸻

📌 Status

Em desenvolvimento.

O projeto encontra-se em evolução e novas funcionalidades poderão ser adicionadas conforme as necessidades dos professores e das turmas.

⸻

👨‍💻 Projeto

Class Diary

Uma ferramenta simples para tornar a gestão diária da sala de aula mais eficiente.