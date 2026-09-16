# Basecamp 2 MCP Server

An MCP (Model Context Protocol) server that wraps the Basecamp 2 REST API, enabling Claude to create and manage todos through natural language.

## Prerequisites

- Node.js 18+
- A Basecamp 2 account with API credentials (username/password)

## Setup

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd Basecamp2_mcp
npm install
```

2. Create a `.env` file (or set environment variables directly):

```bash
cp .env.example .env
```

Fill in the 4 required variables:

| Variable | Description |
|----------|-------------|
| `BASECAMP_ACCOUNT_ID` | Your Basecamp account ID (the number in your Basecamp URL) |
| `BASECAMP_USERNAME` | Your Basecamp login email |
| `BASECAMP_PASSWORD` | Your Basecamp login password |
| `BASECAMP_USER_AGENT` | A User-Agent string identifying your app (e.g. `MyApp (you@example.com)`) |

Basecamp 2 requires a User-Agent with contact info per their [API policy](https://github.com/basecamp/bcx-api#identifying-your-application).

## MCP Client Configuration

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "basecamp2": {
      "command": "node",
      "args": ["/absolute/path/to/Basecamp2_mcp/src/index.js"],
      "env": {
        "BASECAMP_ACCOUNT_ID": "your-account-id",
        "BASECAMP_USERNAME": "your-email",
        "BASECAMP_PASSWORD": "your-password",
        "BASECAMP_USER_AGENT": "YourApp (you@example.com)"
      }
    }
  }
}
```

### Claude Code

Add to your Claude Code settings (`.claude/settings.json` or via `claude mcp add`):

```bash
claude mcp add basecamp2 -- node /absolute/path/to/Basecamp2_mcp/src/index.js
```

Set the environment variables in your shell or `.env` file before starting Claude Code.

## Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List all active projects |
| `get_project` | Get details of a specific project |
| `list_todolists` | List all todo lists in a project |
| `get_todolist` | Get a todo list with its todos |
| `create_todolist` | Create a new todo list |
| `create_todo` | Create a todo item (with optional assignee, due date, attachments) |
| `update_todo` | Update a todo (content, assignee, due date, completion, position) |
| `get_todo` | Get a todo item including its comments |
| `create_comment` | Comment on a todo or todo list (with optional attachments) |
| `upload_attachment` | Upload a file and get an attachment token + name |
| `list_people` | List all people visible to you |
| `get_project_accesses` | List people with access to a project |
| `list_events` | Account-wide activity feed — who did what, when, in which project |
| `list_person_events` | One person's activity — what they commented on, changed, completed or created |

## Troubleshooting

**"Missing required environment variables"** — Ensure all 4 env vars are set. Check `.env.example` for the list.

**401 Unauthorized** — Verify your username and password. Basecamp 2 uses HTTP Basic Auth with your login credentials.

**403 Forbidden** — Your User-Agent may be missing or not include contact info.

**429 Too Many Requests** — The server automatically retries once after the Retry-After delay. If you still hit rate limits, slow down your requests.

**Connection errors** — Confirm your `BASECAMP_ACCOUNT_ID` is correct and that you can access `https://basecamp.com/<id>` in a browser.

## Activity feeds

`list_events` and `list_person_events` wrap Basecamp 2's `events.json` endpoints. They exist for
answering "what has this person been up to" without asking them — the per-person route is the one
BC2 serves best.

Both return a normalized row by default:

```json
{ "id": 2814733369,
  "created_at": "2026-09-16T04:07:22.000-07:00",
  "action": "commented on",
  "summary": "commented on TIME QUOTE: CV2 - Envisia Learning - Adding results from another as...",
  "target":  "TIME QUOTE: CV2 - Envisia Learning - Adding results from another as...",
  "excerpt": "The import file would be around 5-6 hours The report scoring would be around 4 hours",
  "creator": null,
  "project": { "id": 17514231, "name": "@Time Quotes" },
  "eventable": { "type": "Todo", "id": 519880692 },
  "url": "https://basecamp.com/1757845/projects/17514231/todos/519880692#comment_978900828" }
```

Two things worth knowing:

- **`action` and `summary` arrive with raw HTML.** A renamed to-do comes back as
  ``changed a to-do from '<img alt="x" src="https://bcx-production-assets-cdn…'``. Both tools strip
  tags and entities; `excerpt` prefers Basecamp's already-plain `raw_excerpt`. Pass `raw: true` for
  the untouched payload.
- **`creator` is `null` on `list_person_events`** — Basecamp omits it because the person is implied
  by the path. Attribute from the `person_id` you asked for, never from this field. It IS populated
  on `list_events`.

Always pass `since` (ISO8601); without it you get only the most recent page. `all_pages: true`
paginates the whole window, which can be slow over a long one.
