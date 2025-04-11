# Query Manager

A MongoDB query and report management system that allows you to store, execute, and manage queries and generate reports in various formats.

## Features

- Store and manage MongoDB queries
- Execute queries with parameters
- Generate reports in JSON, CSV, and HTML formats
- Asynchronous job processing
- Authentication and authorization
- Rate limiting
- Logging and monitoring
- Configuration management

## Prerequisites

- Node.js >= 14.0.0
- MongoDB >= 4.0.0
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/query-manager.git
cd query-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and configure the environment variables:
```bash
cp .env.example .env
```

4. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Configuration

The application can be configured using environment variables or by modifying the `.env` file. See the `.env.example` file for all available configuration options.

## API Documentation

### Queries

- `GET /api/queries` - Get all queries
- `GET /api/queries/:id` - Get a query by ID
- `POST /api/queries` - Create a new query
- `PUT /api/queries/:id` - Update a query
- `DELETE /api/queries/:id` - Delete a query
- `POST /api/queries/:id/execute` - Execute a query
- `POST /api/queries/batch` - Execute multiple queries

### Reports

- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get a report by ID
- `POST /api/reports` - Create a new report
- `PUT /api/reports/:id` - Update a report
- `DELETE /api/reports/:id` - Delete a report
- `POST /api/reports/:id/generate` - Generate a report
- `GET /api/reports/:id/download` - Download a report

### Jobs

- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get a job by ID
- `POST /api/jobs` - Create a new job
- `DELETE /api/jobs/:id` - Cancel a job
- `GET /api/jobs/:id/result` - Get job result

## Development

### Code Style

The project uses ESLint and Prettier for code formatting. To format the code:

```bash
npm run format
```

To check for linting errors:

```bash
npm run lint
```

### Testing

The project uses Jest for testing. To run the tests:

```bash
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 