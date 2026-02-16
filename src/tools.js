import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { formatError } from './errors.js';

function jsonResult(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function errorResult(error) {
  return { content: [{ type: 'text', text: formatError(error) }], isError: true };
}

export function registerTools(server, client) {

  // ── list_projects ──────────────────────────────────────────────────
  server.tool(
    'list_projects',
    'List all active Basecamp 2 projects',
    {},
    async () => {
      try {
        const data = await client.getAllPages('/projects.json');
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ── get_project ────────────────────────────────────────────────────
  server.tool(
    'get_project',
    'Get details of a specific project',
    { project_id: z.number().describe('The project ID') },
    async ({ project_id }) => {
      try {
        const data = await client.get(`/projects/${project_id}.json`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ── list_todolists ─────────────────────────────────────────────────
  server.tool(
    'list_todolists',
    'List all todo lists in a project',
    { project_id: z.number().describe('The project ID') },
    async ({ project_id }) => {
      try {
        const data = await client.getAllPages(`/projects/${project_id}/todolists.json`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ── get_todolist ───────────────────────────────────────────────────
  server.tool(
    'get_todolist',
    'Get a specific todo list with its todos',
    {
      project_id: z.number().describe('The project ID'),
      todolist_id: z.number().describe('The todo list ID'),
    },
    async ({ project_id, todolist_id }) => {
      try {
        const data = await client.get(`/projects/${project_id}/todolists/${todolist_id}.json`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ── create_todolist ────────────────────────────────────────────────
  server.tool(
    'create_todolist',
    'Create a new todo list in a project',
    {
      project_id: z.number().describe('The project ID'),
      name: z.string().describe('Name of the todo list'),
      description: z.string().optional().describe('Description of the todo list'),
    },
    async ({ project_id, name, description }) => {
      try {
        const body = { name };
        if (description !== undefined) body.description = description;
        const data = await client.post(`/projects/${project_id}/todolists.json`, body);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ── create_todo ────────────────────────────────────────────────────
  server.tool(
    'create_todo',
    'Create a new todo item in a todo list',
    {
      project_id: z.number().describe('The project ID'),
      todolist_id: z.number().describe('The todo list ID'),
      content: z.string().describe('The todo text'),
      assignee_id: z.number().optional().describe('Person ID to assign the todo to'),
      due_at: z.string().optional().describe('Due date in ISO 8601 format (YYYY-MM-DD)'),
      attachment_tokens: z.array(z.string()).optional().describe('Attachment tokens from upload_attachment'),
    },
    async ({ project_id, todolist_id, content, assignee_id, due_at, attachment_tokens }) => {
      try {
        const body = { content };
        if (assignee_id !== undefined) {
          body.assignee = { id: assignee_id, type: 'Person' };
        }
        if (due_at !== undefined) body.due_at = due_at;
        if (attachment_tokens !== undefined) body.attachment_tokens = attachment_tokens;
        const data = await client.post(
          `/projects/${project_id}/todolists/${todolist_id}/todos.json`,
          body
        );
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ── update_todo ────────────────────────────────────────────────────
  server.tool(
    'update_todo',
    'Update an existing todo item',
    {
      project_id: z.number().describe('The project ID'),
      todo_id: z.number().describe('The todo ID'),
      content: z.string().optional().describe('New todo text'),
      assignee_id: z.number().nullable().optional().describe('Person ID to assign to, or null to unassign'),
      due_at: z.string().nullable().optional().describe('Due date (YYYY-MM-DD), or null to remove'),
      completed: z.boolean().optional().describe('Whether the todo is completed'),
      position: z.number().optional().describe('Position in the list (1-based)'),
    },
    async ({ project_id, todo_id, content, assignee_id, due_at, completed, position }) => {
      try {
        const body = {};
        if (content !== undefined) body.content = content;
        if (assignee_id === null) {
          body.assignee = null;
        } else if (assignee_id !== undefined) {
          body.assignee = { id: assignee_id, type: 'Person' };
        }
        if (due_at !== undefined) body.due_at = due_at;
        if (completed !== undefined) body.completed = completed;
        if (position !== undefined) body.position = position;
        const data = await client.put(`/projects/${project_id}/todos/${todo_id}.json`, body);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ── upload_attachment ──────────────────────────────────────────────
  server.tool(
    'upload_attachment',
    'Upload a file to Basecamp 2 and get an attachment token',
    {
      file_path: z.string().describe('Absolute path to the file to upload'),
      content_type: z.string().describe('MIME type of the file (e.g. image/png)'),
    },
    async ({ file_path, content_type }) => {
      try {
        const fileData = await readFile(file_path);
        const data = await client.post('/attachments.json', fileData, {
          contentType: content_type,
          contentLength: fileData.length,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ── list_people ────────────────────────────────────────────────────
  server.tool(
    'list_people',
    'List all people visible to the current user',
    {},
    async () => {
      try {
        const data = await client.getAllPages('/people.json');
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ── get_project_accesses ───────────────────────────────────────────
  server.tool(
    'get_project_accesses',
    'List all people with access to a specific project',
    { project_id: z.number().describe('The project ID') },
    async ({ project_id }) => {
      try {
        const data = await client.getAllPages(`/projects/${project_id}/accesses.json`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    }
  );
}
