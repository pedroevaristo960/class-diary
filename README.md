# 📚 Class Diary

> Aplicação para gestão de turmas e controlo digital de presença.

## 📖 Sobre o Projeto

O **Class Diary** é uma aplicação desenvolvida para ajudar professores a **gerir as suas turmas e controlar a presença dos alunos** de forma rápida, simples e organizada.

A aplicação substitui o processo tradicional de chamada em papel, permitindo centralizar:

- 👨‍🏫 Informações do professor
- 🏫 Turmas
- 👨‍🎓 Alunos
- ✅ Presenças e ausências
- 📋 Histórico das chamadas
- 📊 Acompanhamento da assiduidade

O objetivo é reduzir o tempo gasto com tarefas administrativas e facilitar o acompanhamento diário das turmas.

> **Menos tempo a fazer a chamada. Mais tempo para ensinar.**

---

## ✨ Funcionalidades

### 👨‍🏫 Perfil do Professor

- Registo do nome do professor
- Definição da disciplina
- Organização das informações por professor

### 🏫 Gestão de Turmas

- Criação de turmas
- Visualização das turmas
- Organização dos alunos por turma

### 👨‍🎓 Gestão de Alunos

- Adição de alunos
- Visualização da lista de alunos
- Pesquisa de alunos
- Identificação individual dos estudantes

### ✅ Controlo de Presença

Durante uma chamada, o professor pode:

- Iniciar uma chamada
- Registar alunos presentes
- Registar ausências
- Registar atrasos
- Registar faltas justificadas
- Avançar rapidamente entre os alunos
- Finalizar a chamada

### 📋 Histórico

- Consultar chamadas realizadas
- Visualizar registos de presença
- Consultar o histórico dos alunos

### 📊 Acompanhamento

- Visualizar o resumo de presença da turma
- Consultar faltas e atrasos
- Ver rapidamente a situação individual de cada aluno

### 💾 Persistência de Dados

- Guardar os registos realizados
- Preservar os dados entre sessões

---

## 🎯 Objetivo

O **Class Diary** foi criado para modernizar o processo de chamada e tornar a gestão diária das turmas mais eficiente.

A aplicação procura resolver um problema simples e recorrente no ambiente escolar: **o tempo e a organização necessários para realizar e acompanhar chamadas manualmente**.

---

## 🛠️ Tecnologias

O projeto foi desenvolvido utilizando:

| Tecnologia | Utilização |
|---|---|
| **React** | Construção da interface |
| **TypeScript** | Tipagem e segurança do código |
| **Vite** | Ambiente de desenvolvimento e build |

---

## 🚀 Executar o Projeto

### Pré-requisitos

Certifique-se de ter instalado:

- [Node.js](https://nodejs.org/)
- npm

### Instalação

Clone o repositório:

```bash
git clone <URL_DO_REPOSITORIO>
```

Entre na pasta do projeto:

```bash
cd class-diary
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Depois, abra a URL apresentada pelo Vite no terminal.

---

## 📦 Scripts Disponíveis

```bash
npm run dev
```

Inicia o ambiente de desenvolvimento.

```bash
npm run build
```

Gera a versão de produção da aplicação.

```bash
npm run preview
```

Executa localmente a build de produção.

```bash
npm run lint
```

Executa a verificação do ESLint.

---

## 📁 Estrutura do Projeto

```text
class-diary/
├── public/
├── src/
│   ├── ...
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
└── README.md
```

A estrutura interna de `src/` poderá evoluir conforme novas funcionalidades forem adicionadas ao projeto.

---

## 🔍 Qualidade de Código

O projeto utiliza **ESLint** para análise estática e padronização do código.

Para projetos React + TypeScript destinados a produção, recomenda-se utilizar regras **type-aware** do TypeScript ESLint.

Também podem ser utilizadas regras específicas para React, como:

- `eslint-plugin-react-x`
- `eslint-plugin-react-dom`

A configuração de lint deverá acompanhar a evolução e as necessidades do projeto.

---

## ⚛️ React e Vite

O Class Diary utiliza **React + TypeScript + Vite**, proporcionando um ambiente de desenvolvimento rápido e suporte a **Hot Module Replacement (HMR)**.

### Plugins React

Dependendo da configuração utilizada pelo projeto, o Vite pode utilizar:

- `@vitejs/plugin-react`
- `@vitejs/plugin-react-swc`

### React Compiler

O **React Compiler** não é utilizado por padrão.

A sua adoção poderá ser avaliada futuramente caso existam benefícios concretos para o projeto.

---

## 📌 Estado do Projeto

**🚧 Em desenvolvimento**

O Class Diary encontra-se em desenvolvimento e poderá receber novas funcionalidades, melhorias de interface e alterações na arquitetura conforme as necessidades dos professores e das turmas.

### Próximas possibilidades

- 📈 Estatísticas detalhadas de assiduidade
- 📅 Calendário de aulas
- 📑 Relatórios de presença
- 📤 Exportação de dados
- 🔔 Notificações
- 👥 Suporte a múltiplos professores
- ☁️ Sincronização de dados
- 🔐 Autenticação e gestão de utilizadores

---

## 🤝 Contribuição

Contribuições, sugestões e melhorias são bem-vindas.

Para contribuir:

1. Faça um fork do projeto.
2. Crie uma branch para a sua alteração.
3. Implemente e teste as alterações.
4. Faça commit das alterações.
5. Abra um Pull Request.

---

## 👨‍💻 Projeto

**Class Diary**

Uma ferramenta simples para tornar a gestão diária da sala de aula mais eficiente.

> **Organizar melhor. Registar mais rápido. Ensinar melhor.**
