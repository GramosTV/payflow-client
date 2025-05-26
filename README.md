# PayFlow Client

**Server repository:** [https://github.com/GramosTV/payflow-server](https://github.com/GramosTV/payflow-server)

The PayFlow Client is the frontend application for the PayFlow Lite digital wallet system. Built with Angular, it provides a responsive and intuitive user interface for managing digital transactions, wallet operations, money requests, and QR code payments.

## Features

- **User Authentication**: Secure login and registration
- **Wallet Management**: View balance, deposit, and withdraw funds
- **Transaction History**: Track all financial transactions
- **Money Requests**: Request payments from other users
- **QR Code Payments**: Generate and scan QR codes for quick payments
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling**: Robust error management with retry mechanisms for network issues

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

## Recent Enhancements

### QR Code Image Loading Optimization

We've improved QR code image handling with several enhancements:

1. **Retry Logic**: Added automatic retry mechanism for loading QR code images

   ```typescript
   private loadQrCodeImage(qrCodeId: number, retryCount: number = 0, maxRetries: number = 3): void {
     this.qrCodeService.getQRCodeImageById(qrCodeId).subscribe({
       next: (imageData) => { /* success handler */ },
       error: (error) => {
         if (retryCount < maxRetries) {
           setTimeout(() => this.loadQrCodeImage(qrCodeId, retryCount + 1), 1000);
         } else {
           this.errorHandler.handleApiError(error, 'loading QR code');
         }
       }
     });
   }
   ```

2. **Enhanced Error Handling**: Improved error handling service with specific error messages for different scenarios

   ```typescript
   showSuccessMessage(message: string): void
   showErrorMessage(message: string): void
   ```

3. **Loading States**: Added proper loading states to improve user experience during image loading

### Backend Integration Fixes

The client application has been updated to work with the improved QR code API endpoints in the server, which now properly handle lazy-loaded entity relationships.

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

## Troubleshooting

### Common Issues and Solutions

1. **QR Code Image Loading Failures**:

   - Check network connectivity to the API server
   - Verify the QR code ID exists and is active
   - Try refreshing the page or regenerating the QR code

2. **Authentication Issues**:

   - Clear browser cookies and local storage
   - Check that the JWT token hasn't expired
   - Verify API server is running and accessible

3. **Wallet Balance Not Updating**:
   - Refresh the wallet data using the refresh button
   - Check for pending transactions that might affect your balance
   - Verify the transaction was completed successfully

## UI/UX Design

The PayFlow client interface is designed with these principles:

- **Clean and Minimal**: Focus on essential information
- **Intuitive Navigation**: Easy access to key features
- **Mobile First**: Responsive design works well on all screen sizes
- **Feedback**: Clear notifications for all user actions

## Contributing

Please refer to the contribution guidelines in the main repository for information on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
