# KIVON ERP

Plataforma inteligente para gestão completa de obras e equipes.

## 🚀 Tecnologias

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Navegação**: React Router
- **Componentes & UI**: Headless UI + Radix / Lucide React
- **Gráficos**: Recharts
- **Relatórios**: jsPDF, xlsx
- **Câmera**: React Webcam
- **Backend & Auth**: Supabase (PostgreSQL + Go/Rust APIs)
- **Deploy**: Node.js/Vite, PWA habilitado, Cloud Run / Vercel

## 📦 Estrutura de Pastas

O projeto adota uma arquitetura baseada em features (Feature-Sliced Design simplificado):

```
src/
 ├── app/               # Configuração global (Providers, Router)
 ├── features/          # Módulos principais (auth, admin, obras, diárias, relatórios...)
 │   └── [modulo]/
 │       └── pages/     # Páginas específicas daquele módulo
 ├── shared/            # Componentes reutilizáveis (Layout, UI, Utils)
 │   ├── components/    # (Button, Input, Modal, Sidebar)
 │   └── lib/           # (supabase.ts, utils.ts)
 └── index.css          # Padrões Tailwind
```

## ⚙️ Configuração Local

1. Clone o repositório.
2. Certifique-se de usar Node.js 22+.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Crie o arquivo `.env` na raiz do projeto (use o `.env.example` como base) e preencha as credenciais:
   ```env
   VITE_SUPABASE_URL=seu_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
   SUPABASE_SECRET_KEY=sua_chave_secreta_de_servico
   ```
5. Rode as migrations do banco de dados no Supabase. Execute o conteúdo de `DATABASE_SETUP.sql`.
6. Crie o administrador padrão usando o script (opcional):
   ```bash
   npm run seed-admin
   ```
7. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse a porta listada no terminal.

## 🚢 Build e Deploy

Para compilar a aplicação para produção:

```bash
npm run build
```
O build utilizará o Vite para otimizar o front-end e o ESBuild para compilar a API Backend Express localizada em `server.ts`.
Os arquivos gerados estarão no diretório `dist/`.

Para iniciar o servidor compilado:
```bash
npm run start
```

**Dependências Inutilizadas ou Código Morto**
As páginas e mocks iniciais não utilizados (arquivos .js soltos) não foram incluídos no fluxo de deploy para manter a integridade limpa.
