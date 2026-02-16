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
| `upload_attachment` | Upload a file and get an attachment token |
| `list_people` | List all people visible to you |
| `get_project_accesses` | List people with access to a project |

## Troubleshooting

**"Missing required environment variables"** — Ensure all 4 env vars are set. Check `.env.example` for the list.

**401 Unauthorized** — Verify your username and password. Basecamp 2 uses HTTP Basic Auth with your login credentials.

**403 Forbidden** — Your User-Agent may be missing or not include contact info.

**429 Too Many Requests** — The server automatically retries once after the Retry-After delay. If you still hit rate limits, slow down your requests.

**Connection errors** — Confirm your `BASECAMP_ACCOUNT_ID` is correct and that you can access `https://basecamp.com/<id>` in a browser.
