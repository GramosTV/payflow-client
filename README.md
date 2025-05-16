# PayFlow Client

The PayFlow Client is the frontend application for the PayFlow Lite digital wallet system. Built with Angular, it provides a responsive and intuitive user interface for managing digital transactions, wallet operations, money requests, and QR code payments.

## Features

- **User Authentication**: Secure login and registration
- **Wallet Management**: View balance, deposit, and withdraw funds
- **Transaction History**: Track all financial transactions
- **Money Requests**: Request payments from other users
- **QR Code Payments**: Generate and scan QR codes for quick payments
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Architecture

The application follows a modular architecture:

- **Models**: TypeScript interfaces for data structures
- **Services**: API communication and business logic
- **Components**: Reusable UI components
- **Pages**: Main application views
- **Guards**: Route protection for authenticated routes
- **Interceptors**: HTTP request/response handling

## Prerequisites

- Node.js (v18.x or higher)
- npm (v9.x or higher)
- Angular CLI (v19.x)

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/payflow.git
cd payflow/payflow-client
```

2. Install dependencies:

```bash
npm install
```

3. Configure the environment:

   - Update `src/environments/environment.ts` for development settings
   - Update `src/environments/environment.prod.ts` for production settings

4. Start the development server:

```bash
npm start
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Integration with PayFlow Server

This client application is designed to work with the PayFlow Server API. To run the complete system:

1. Start the PayFlow Server (Spring Boot application)
2. Ensure the API endpoint in `environment.ts` points to the correct server URL
3. Start the client application

The default configuration assumes the server is running at `http://localhost:8090/api/v1`.

## Styling

The application uses:

- **Tailwind CSS**: For utility-first styling
- **SCSS**: For component-specific styles

## Deployment

### Production Build

```bash
npm run build --prod
```

This creates optimized production files in the `dist/` directory.

### Docker Deployment

A Dockerfile is provided in the root directory for containerized deployment:

```bash
# Build the Docker image
docker build -t payflow-client .

# Run the container
docker run -p 80:80 payflow-client
```

### Docker Compose

The entire system (client and server) can be deployed using the Docker Compose file in the parent directory:

```bash
cd ../
docker-compose up -d
```

## Contributing

Please refer to the contribution guidelines in the main repository for information on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
