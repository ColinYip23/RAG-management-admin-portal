# RAG Management Admin Portal

A comprehensive Next.js admin dashboard for managing RAG (Retrieval-Augmented Generation) knowledge bases and WhatsApp integration sessions.

## 🎯 Features

### 📱 WhatsApp Session Management
- Create and manage WhatsApp business account sessions
- Real-time session status monitoring (CONNECTED/DISCONNECTED)
- QR code-based device linking
- Enable/disable AI agent chatbot per session
- Delete sessions with confirmation
- Integration with Chatwoot for conversation management

### 📚 Knowledge Base Management
- Create, edit, and delete notebooks
- Support for multiple notebook types (QnA, Article)
- Department-scoped and global notebook visibility
- Bulk import Q&A from Excel files (.xlsx)
- System prompt customization per notebook
- Knowledge base entry management

### 🔖 Notebook Tagging
- Assign notebooks to WhatsApp sessions
- Multi-select interface for flexible tagging
- Automatic notebook filtering by department
- Support for global notebooks across all departments

### 👥 Role-Based Access Control
- **Admin**: Full access to all notebooks, sessions, and departments
- **User**: Limited to their assigned department, can create global notebooks
- Department-level data isolation
- Permission-based UI controls

### 🌡️ Warming Up Numbers
- Pre-warm WhatsApp numbers before deployment
- Bulk selection and control
- Start/Pause/Stop warming up sequences

### 🎨 Theme Support
- Light/Dark mode toggle
- Persistent theme preference
- System-wide theme application

### 🔐 Authentication
- Email/password-based authentication via Supabase
- Role and department assignment during signup
- Session persistence
- Secure logout

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ with TypeScript
- **UI**: React with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Handling**: XLSX (Excel file parsing)
- **HTTP Client**: Fetch API
- **State Management**: React Hooks

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Environment variables configured

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd rag-management-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
app/
├── components/          # React components
│   ├── AuthScreen.tsx
│   ├── SessionTable.tsx
│   ├── EditSessionPanel.tsx
│   ├── NotebookList.tsx
│   ├── CreateNotebookModal.tsx
│   ├── EditNotebookModal.tsx
│   ├── CreateSessionWizard.tsx
│   ├── WarmingUpPanel.tsx
│   ├── KnowledgeBasePanel.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useSessions.ts
│   ├── useProfile.ts
│   ├── useNotebookTagging.ts
│   ├── useNotebookSelection.ts
│   └── ...
├── types/              # TypeScript type definitions
│   └── WahaSession.ts
├── page.tsx            # Main dashboard page
├── layout.tsx          # Root layout
└── globals.css         # Global styles
lib/
├── supabaseClient.ts   # Supabase initialization
public/                # Static assets
```

## 🔌 API Integration

The application integrates with external webhooks for:

- **Session Creation**: `https://flow2.dlabs.com.my/webhook/session creation`
- **Session Deletion**: `https://flow2.dlabs.com.my/webhook/delete_session`
- **Notebook Creation**: `https://flow2.dlabs.com.my/webhook/table_creation`
- **Notebook Deletion**: `https://flow2.dlabs.com.my/webhook/notebook_deletion`
- **Entry Management**: `https://flow2.dlabs.com.my/webhook/table_entry`
- **Knowledge Base Listing**: `https://flow2.dlabs.com.my/webhook/KB_listing`
- **Warming Up**: `https://flow2.dlabs.com.my/webhook-test/warmup`

## 🗄️ Database Schema

### waha_sessions
- `id`: Session identifier
- `WhatsApp`: WhatsApp number
- `Department`: Associated department
- `Status`: Connection status
- `Enabled`: Chatbot enabled flag
- `notebooks`: Assigned notebook array

### notebooks
- `id`: Notebook identifier
- `title`: Notebook name
- `type`: Notebook type (QnA/Article)
- `department`: Associated department
- `is_global`: Global visibility flag
- `system_prompt`: AI system prompt

### profiles
- `email`: User email
- `role`: User role (admin/user)
- `department`: User department

## 🔐 Authentication Flow

1. User enters email and password
2. On signup, user selects their department
3. Supabase creates user account and profile
4. After confirmation, user can login
5. Session persists across page reloads
6. User profile and permissions are loaded

## 📝 Common Tasks

### Create a Notebook
1. Click "+ Create Notebook" in Knowledge Base section
2. Enter title, select type (QnA/Article)
3. Add system prompt (optional)
4. Select department and visibility
5. Optionally import Q&A from Excel file
6. Click "Create"

### Create a WhatsApp Session
1. Click "Create Session" button
2. Enter WhatsApp number
3. Select department
4. Select notebooks to assign
5. Scan QR code with WhatsApp
6. Session will be created upon successful scan

### Edit Session Notebooks
1. Click "Edit" on a session in the table
2. Toggle notebooks to assign/unassign
3. Click "Save Notebook Tags"

### Import Q&A Data
1. Prepare Excel file with "question" and "answer" columns
2. While creating/editing notebook, upload the .xlsx file
3. Review imported entries
4. Click "Create" or "Add entries"

## 🚢 Deployment

### Deploy to Vercel
```bash
npm run build
git push  # Push to your git provider
```

The app will auto-deploy on Vercel.

### Build for Production
```bash
npm run build
npm run start
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Troubleshooting

### "Cannot find module '@/app/types/WahaSession'"
Ensure the file exists at `app/types/WahaSession.ts`

### Notebook not appearing after creation
Check that the department and visibility settings match your user permissions

### Excel import fails
Verify the .xlsx file has "question" and "answer" columns with proper formatting

### Supabase connection errors
Check that environment variables are correctly set in `.env.local`

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Made with ❤️ for RAG Management**
