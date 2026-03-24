FROM node:20-slim

# We install all the necessary OS-level shared libraries that Chrome Headless requires.
# We also update apt-get to ensure we can fetch the packages.
RUN apt-get update && apt-get install -y \
  libnspr4 \
  libnss3 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libpangocairo-1.0-0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libxkbcommon0 \
  libasound2 \
  libpango-1.0-0 \
  libcairo2 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . ./

CMD ["npx", "ts-node", "src/index.ts"]
