# Dockerfile para el Backend de AutoCarService
FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto de los archivos de la aplicación
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "index.js"]

