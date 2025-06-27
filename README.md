# MiEcommerce Frontend (React)

This is the frontend for the MiEcommerce application, built with React. It consumes the Django backend API to provide an interactive user experience for the online store.

## Features

- **Intuitive Navigation:** Pages for Home, product listings, product details, etc.
- **Responsive Design:** Adapted for a great experience on mobile and desktop devices using Tailwind CSS.
- **User Authentication:** Full flow for registration, login, logout, and session management with JWT.
- **Cart Management:** Functionality to add, update, and remove products from the shopping cart.
- **Dynamic Filtering:** Search, filters, and sorting on the product list page.
- **Reusable Components:** Component-based structure for maintainability.

## Tech Stack

- **Framework:** React
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **State Management:** Context API + `useReducer`
- **HTTP Requests:** Axios
- **Styling:** Tailwind CSS
- **Form Management:** React Hook Form
- **Notifications:** React Toastify
- **Icons:** React Icons

## Local Environment Setup

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation Steps

1.  **Clone the Repository (if cloning separately):**
    ```bash
    git clone [YOUR_REPOSITORY_URL]
    cd [repository-name]/frontend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root of the `frontend` folder.

    Copy the contents of `.env.example` or use the following template:
    ```env
    # frontend/.env

    # Base URL of the backend API for the local development environment.
    # Make sure your Django backend allows CORS from http://localhost:5173
    VITE_API_BASE_URL=http://localhost:8000/api/
    ```
    *Note: For deployment with Docker Compose and Nginx, this variable is set to `/api/` to use relative paths.*

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the port Vite indicates).

## Available Scripts

In the project directory, you can run:

-   `npm run dev`: Starts the application in development mode.
-   `npm run build`: Builds the app for production to the `dist` folder.
-   `npm run lint`: Runs the linter (if configured).
-   `npm run preview`: Locally previews the production build.

## Folder Structure

The project structure follows an organization by features and reusable components:

-   `src/assets`: Static images, fonts, etc.
-   `src/components`: Generic and reusable UI components (`common`, `layout`, etc.).
-   `src/contexts`: React contexts for global state management (`AuthContext`, `CartContext`).
-   `src/hooks`: Custom hooks.
-   `src/pages`: Components that represent a full page or view of the application.
-   `src/services`: Logic for interacting with the backend API.
-   `src/utils`: Generic utility functions.
-   `src/RouterConfig.jsx`: Central definition of the application's routes.