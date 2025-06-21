# Dockerfile (para el frontend React - servido por Nginx)

# --- Etapa de Build ---
FROM node:18-alpine AS build-stage # Elige una versión de Node LTS

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build # Esto crea la carpeta 'dist' o 'build'

# --- Etapa de Producción ---
FROM nginx:stable-alpine

# Copia los archivos construidos de la etapa de build a la carpeta de Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html 
# O /app/build si create-react-app lo llama así

# Opcional: Copia una configuración personalizada de Nginx si la necesitas
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]