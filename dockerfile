# frontend/Dockerfile

# --- Etapa de Build ---
FROM node:18-alpine AS build-stage

WORKDIR /app

# Argumento para la URL de la API, que se convertirá en variable de entorno para Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package*.json ./
RUN npm install

COPY . .
RUN echo "Construyendo frontend con VITE_API_BASE_URL=${VITE_API_BASE_URL}" && npm run build

# --- Etapa de Producción ---
FROM nginx:stable-alpine

# Copia los archivos construidos de la etapa de build a la carpeta de Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf 
# O /app/build si create-react-app lo llama así. Para Vite, 'dist' es común.

# Opcional: Copia una configuración personalizada de Nginx SI la necesitas para ESTE Nginx específico del frontend.
# Normalmente, para una SPA, la configuración por defecto de Nginx (servir index.html)
# y la que pusimos en el Nginx principal (try_files) es suficiente.
# COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf 

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]