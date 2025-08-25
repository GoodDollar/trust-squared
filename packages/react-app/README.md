🟢 Trust-Squared Installation Guide (Ubuntu/Linux)
This guide will walk you through cloning, setting up, and running the Trust-Squared project on your local machine. It also includes troubleshooting tips for common issues we encountered during setup.

✅ Requirements
Make sure you have the following installed:

Git
VS Code or any text editor
Node.js (v18 or later)
Yarn v4 (Berry)
Ubuntu 22.04+ (tested on Ubuntu 24)
🧱 Project Structure
This is a monorepo managed by Yarn Workspaces.
The important packages are:

packages/
├── hardhat      # Smart contract backend
├── react-app    # Main frontend
├── subgraph     # GraphQL service (optional)
├── verifier     # Possibly frontend or API
📥 Clone the Repo
cd ~/Desktop
git clone https://github.com/amanzrx4/trust-squared
cd trust-squared
🔧 Set Up Node.js (with Corepack support)
You must install Node via nvm to get corepack which is required for Yarn v4+.

1. Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
2. Install Node.js LTS version
nvm install --lts
3. Enable Corepack
corepack enable
corepack prepare yarn@stable --activate
4. Verify Versions
node -v     # should be >= 18
yarn -v     # should show 3.x or 4.x (e.g., 4.5.1)
📦 Install Dependencies
Make sure you’re in the project root (trust-squared/):

yarn install
This installs dependencies for all subprojects.

⚠️ Common Errors & Fixes
❌ Error: Could not resolve "@wagmi/core"
This is caused by a missing peer dependency used by @base-org/account.

✅ Fix:
yarn add @wagmi/core
You may have tried installing it inside the workspace (react-app) only — it needs to be available globally.

🚀 Start the App (Frontend)
The main frontend is inside packages/react-app.

To run it:
yarn react-app:dev
This should start Vite on:

http://localhost:5173
🧪 Troubleshooting Other Peer Errors
You might see warnings like:

@dynamic-labs/wagmi-connector is missing @wagmi/core
@celo-composer-minipay-template/react-app doesn't provide esbuild
You can fix them by manually adding the required packages:

yarn add esbuild eventemitter3
yarn add @dynamic-labs/ethereum-core @dynamic-labs/logger
Install only if they actually cause errors on startup.

💡 Extra Notes
If you need to rebuild native modules (like sharp, keccak, etc), try:

yarn rebuild
If you change any config in .yarnrc.yml, you may need to reinstall:

rm -rf .yarn/cache
yarn install
🧼 Clean Setup (If Things Break)
If you ever need to reset everything:

rm -rf node_modules .yarn .yarnrc.yml yarn.lock
corepack prepare yarn@stable --activate
yarn install
🙋‍♀️ Need Help?
If anything fails or is unclear, please reach out to your teammate who ran this setup successfully — or check with the repo maintainer for updates.

✅ Good luck, and happy coding!