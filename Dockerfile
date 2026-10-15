# Bygger appen i ett trinn og kjører den minimalt i et annet.
# Node-versjonen er låst til samme som utviklingsmaskinen (node:sqlite er innebygd).

FROM node:26.8.2-slim AS bygg
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# BYGG_STANDALONE slår på `output: "standalone"` i next.config.ts (bare i bildet, ikke lokalt).
ENV BYGG_STANDALONE=1 NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:26.8.2-slim AS kjor
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=bygg /app/.next/standalone ./
COPY --from=bygg /app/.next/static ./.next/static
COPY --from=bygg /app/public ./public
# Skjemaet leses av appen ved første oppstart (lib/tilkobling.ts), så det må ligge ved siden av server.js.
COPY --from=bygg /app/db ./db
COPY docker-start.sh ./docker-start.sh
# Databasefila ligger i volumet på /app/data, ikke i bildet.
RUN mkdir -p data && chown node:node data && chmod +x docker-start.sh
USER node
EXPOSE 3000
CMD ["./docker-start.sh"]
