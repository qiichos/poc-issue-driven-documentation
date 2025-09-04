# API Reference

This document contains the API reference for our system

## Authentication

All API calls require authentication using GitHub tokens

### Headers

```http
Authorization: Bearer ghp_your_token_here
Content-Type: application/json.
```

## Endpoints

### Comments API

#### POST /api/comments

Creates a new comment and GitHub issue.

**Request body:**

```json
{
  "from": 10,
  "to": 25,
  "anchorText": "selected text",
  "body": "Your comment here"
}
```

**Response:**

```json
{
  "issueNumber": 42,
  "issueUrl": "https://github.com/user/repo/issues/42"
}
```

### Documents API

#### GET /api/documents

Returns a list of all available documents.

#### GET /api/documents/\[slug\]

Returns the content of a specific document.

#### PUT /api/documents/\[slug\]

Updates the content of a specific document.

## Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
