FROM node:alpine

WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm clean-install
COPY server.js /app/

USER nobody
EXPOSE 5000
CMD ["nodejs", "server.js"]
