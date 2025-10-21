# Email Builder

Visual email builder with scheduling. Built with Next.js, Puck, React Email, and Temporal.

## What This Does

This is an email builder application with the following features:

- Drag-and-drop interface for designing emails
- Real-time preview across different viewport sizes (mobile, tablet, desktop)
- Immediate email sending via Resend
- Email scheduling for future delivery using Temporal workflows
- Dashboard to view and cancel scheduled emails

Users drag email components (containers, sections, headings, text, buttons, images) onto a canvas, customize their properties, and preview before sending.

## Architecture

### Tech Stack

- Next.js 15 (App Router)
- Puck (visual page builder)
- React Email
- Resend API
- Temporal Cloud
- Tailwind CSS
- TypeScript

### Core Components

#### 1. Editor Page (`src/app/editor/page.tsx`)

Main interface where email design happens:

- Puck integration: visual drag-and-drop editor with component palette
- Live preview: real-time rendering as users build
- Viewport controls: switch between mobile (390px), tablet (768px), and desktop (1280px)
- Action buttons:
  - "Send Test Email" - opens modal to send immediately or schedule
  - "Scheduled Emails" - opens modal to view/manage scheduled emails
  - "Load Sample" - loads pre-configured sample email
  - "Clear" - resets the canvas

Maintains state using React hooks, persists email design data in memory.

#### 2. Email Components Configuration (`src/lib/puckConfig.tsx`)

Defines draggable email components:

- Container: wrapper with padding, max-width, background color, alignment
- Section: layout component for grouping content
- Heading: text heading (H1/H2/H3) with alignment and color
- Text: paragraph text with alignment and color
- Button: CTA button with label, link, colors, border radius, padding
- Image: image with src, alt text, width, alignment

Each component has:
- `fields`: editable properties shown in sidebar
- `defaultProps`: default values
- `render`: React component using React Email components

#### 3. Server-Side Email Configuration (`src/lib/serverConfig.tsx`)

Server-compatible version of the Puck config. Used for rendering emails in:
- API routes (immediate sends)
- Temporal activities (scheduled sends)

Separate from client config because server environment doesn't have access to client-side React hooks or browser APIs.

#### 4. Email Sending Flow

##### Immediate Sending (`src/app/api/send-email/route.tsx`)

1. Receives email data (Puck data structure), recipient, and subject
2. Validates input (email format, required fields, content presence)
3. Recursively renders Puck nodes into React Email components using `renderNode()`
4. Wraps content in HTML structure with Tailwind support
5. Renders to HTML and plain text using `@react-email/render`
6. Sends via Resend API
7. Returns success/error response

##### Scheduled Sending (`src/app/api/schedule-email/route.ts`)

1. Receives email data, recipient, subject, and scheduled time
2. Validates input including that scheduled time is in the future
3. Generates unique schedule ID and workflow ID
4. Connects to Temporal Cloud and starts a workflow
5. Stores scheduled email metadata in `scheduled-emails.json`
6. Returns success with schedule ID

#### 5. Temporal Workflow System

Scheduled email system using Temporal for durable workflow execution:

##### Workflow (`src/temporal/workflows.ts`)

```typescript
scheduleEmailWorkflow(input: ScheduleEmailInput): Promise<void>
```

- Calculates delay from now until scheduled time
- Uses `sleep(delayMs)` to wait (durable - survives server restarts)
- Calls `sendEmailActivity` when time arrives

##### Activity (`src/temporal/activities.tsx`)

```typescript
sendEmailActivity(input: SendEmailActivityInput): Promise<void>
```

- Renders email components to HTML (same logic as immediate send)
- Sends email via Resend
- Updates status in `scheduled-emails.json` to "sent"
- Logs success

##### Worker (`src/temporal/worker.ts`)

- Long-running process that connects to Temporal Cloud
- Polls the `email-scheduling` task queue for work
- Executes workflow code and activities
- Must be running for scheduled emails to be sent

##### Client (`src/temporal/client.ts`)

- Singleton Temporal client for API routes
- Manages connection to Temporal Cloud with TLS and API key
- Used by API routes to start workflows

#### 6. Email Send Form (`src/components/email/EmailSendForm.tsx`)

Modal component with two modes:

Send Now Mode:
- Input fields for recipient email and subject
- Validates email format and required fields
- Calls `/api/send-email` endpoint
- Shows success/error notifications

Schedule Send Mode:
- Date and time picker inputs
- Validates scheduled time is in future
- Calls `/api/schedule-email` endpoint
- Creates Temporal workflow for deferred execution

#### 7. Scheduled Emails Modal (`src/components/email/ScheduledEmailsModal.tsx`)

Dashboard for managing scheduled emails:

- List view showing all scheduled, sent, and cancelled emails
- Filter tabs by status (all/scheduled/sent/cancelled)
- Email cards displaying recipient, subject, scheduled time, status
- Cancel button for pending scheduled emails
- Auto-refresh after cancellation

API endpoints:
- `GET /api/scheduled-emails` - fetch all scheduled emails
- `POST /api/cancel-scheduled-email` - cancel a specific schedule

#### 8. Scheduled Email Storage (`src/lib/scheduledEmailStorage.ts`)

File-based persistence using `scheduled-emails.json`:

```typescript
interface ScheduledEmail {
  scheduleId: string;      // Unique identifier
  workflowId: string;      // Temporal workflow ID
  to: string;              // Recipient email
  subject: string;         // Email subject
  emailData: any;          // Puck data structure
  scheduledFor: string;    // ISO timestamp
  status: 'scheduled' | 'sent' | 'cancelled';
  createdAt: string;       // Creation timestamp
  sentAt?: string;         // When it was sent
  cancelledAt?: string;    // When it was cancelled
}
```

Functions:
- `getScheduledEmails()`: Read all scheduled emails
- `addScheduledEmail()`: Add new scheduled email
- `updateScheduledEmail()`: Update status/timestamps
- `getScheduledEmailsByStatus()`: Filter by status

#### 9. API Routes

- `POST /api/send-email` - send email immediately
- `POST /api/schedule-email` - schedule email for future delivery
- `GET /api/scheduled-emails` - get all scheduled emails
- `POST /api/cancel-scheduled-email` - cancel a scheduled email by terminating its workflow
- `POST /api/render-email` - render email to HTML (preview endpoint)

## How Everything Ties Together

### User Journey: Immediate Send

1. User opens `/editor`
2. User drags components (Container, Section, Text, Button, Image) onto canvas
3. User clicks component to edit properties in right sidebar
4. Live preview shows changes in real-time
5. User clicks "Send Test Email"
6. Modal opens with "Send Now" selected
7. User enters recipient and subject
8. User clicks "Send Test Email" button
9. Frontend calls `POST /api/send-email`
10. API renders email components to HTML using React Email
11. API sends via Resend
12. User sees success notification

### User Journey: Scheduled Send

1. User builds email in editor (steps 1-4 above)
2. User clicks "Send Test Email"
3. User switches to "Schedule Send" tab
4. User enters recipient, subject, date, and time
5. User clicks "Schedule Email" button
6. Frontend calls `POST /api/schedule-email`
7. API creates unique schedule ID
8. API starts Temporal workflow with scheduled time
9. API saves schedule metadata to `scheduled-emails.json`
10. User sees success notification
11. **Temporal Worker** (running separately) polls for workflows
12. Worker executes workflow code
13. Workflow sleeps until scheduled time (durable - survives restarts)
14. At scheduled time, workflow calls `sendEmailActivity`
15. Activity renders email and sends via Resend
16. Activity updates status to "sent" in `scheduled-emails.json`

### User Journey: Managing Schedules

1. User clicks "📅 Scheduled Emails" button
2. Modal opens, calls `GET /api/scheduled-emails`
3. Displays list of all schedules with status badges
4. User can filter by status using tabs
5. For "scheduled" emails, user can click "Cancel"
6. System calls `POST /api/cancel-scheduled-email`
7. API terminates the Temporal workflow
8. API updates status to "cancelled" in storage
9. List refreshes automatically

## Running Locally

### Prerequisites

1. Node.js 18+ (required for Next.js 15)
2. npm
3. Resend account
   - Sign up at [resend.com](https://resend.com)
   - Get API key from dashboard
4. Temporal Cloud account
   - Sign up at [temporal.io](https://temporal.io)
   - Create namespace
   - Get connection details (address, namespace, API key)

### Environment Setup

Clone and install:

```bash
cd /Users/preethammadesh/Desktop/nautilus/email-builder
npm install
```

Create `.env.local` in project root:

```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev

# Temporal Cloud Configuration
TEMPORAL_ADDRESS=your-namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace.account-id
TEMPORAL_API_KEY=your-temporal-api-key
```

Notes:
- For `RESEND_FROM_EMAIL`: use `onboarding@resend.dev` for testing, or verify your own domain
- For Temporal: use actual Cloud connection details from Temporal Cloud console
- Can text me for my keys if needed.

### Running the Application

Run two separate processes:

Terminal 1 - Next.js dev server:

```bash
npm run dev
```

Starts web application at `http://localhost:3000`

Terminal 2 - Temporal worker:

```bash
npm run worker
```


Starts Temporal worker that processes scheduled email workflows.

Note: Temporal worker must be running for scheduled emails to be sent. If you stop the worker, scheduled workflows pause and resume when worker restarts.

### Accessing the Application

Open browser to `http://localhost:3000/editor`

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── send-email/           # Immediate email sending
│   │   ├── schedule-email/       # Schedule email for later
│   │   ├── scheduled-emails/     # Get all schedules
│   │   ├── cancel-scheduled-email/ # Cancel schedule
│   │   └── render-email/         # Render email to HTML
│   ├── editor/                   # Main editor page
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/
│   └── email/
│       ├── EmailSendForm.tsx     # Send/schedule modal
│       └── ScheduledEmailsModal.tsx # Manage schedules modal
├── lib/
│   ├── puckConfig.tsx            # Client-side email components
│   ├── serverConfig.tsx          # Server-side email components
│   ├── sampleData.tsx            # Sample email data
│   └── scheduledEmailStorage.ts  # JSON file persistence
└── temporal/
    ├── workflows.ts              # Temporal workflow definitions
    ├── activities.tsx            # Temporal activities (send email)
    ├── worker.ts                 # Worker process
    └── client.ts                 # Temporal client singleton

scheduled-emails.json              # Scheduled email database (auto-created)
```