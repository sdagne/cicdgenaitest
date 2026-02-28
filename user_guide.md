# Guide to Creating CI/CD Pipelines for DEV, UAT, and PROD

This guide provides step-by-step instructions on setting up GitHub Actions CI/CD to deploy your code from local VS Code to AWS EC2 across three separate environments: **DEV**, **UAT**, and **PROD**.

## Environment Overview

### 1) DEV (Development)
- **Purpose**: This environment is used by developers to test new features, bug fixes, and continuous integration. It represents the latest development state.
- **Trigger**: Automatically triggered on pushes to the `dev` branch or on every pull request targeting `dev`.
- **What to do here**:
  - Run unit tests and linters.
  - Automatically deploy to the DEV EC2 instance to ensure the application builds and runs correctly.
  - Developers check this environment to verify their recent commits without impacting real users.

### 2) UAT (User Acceptance Testing)
- **Purpose**: This environment mirrors production as closely as possible. It is used by QA teams, product managers, and clients to test the application before it goes live.
- **Trigger**: Triggered on pull requests, merges to the `main` or `release` branch, or via a manual trigger (`workflow_dispatch`).
- **What to do here**:
  - Run integration tests, end-to-end tests, and performance tests.
  - Deploy to the UAT EC2 instance.
  - Stakeholders perform manual testing and "sign off" on features.

### 3) PROD (Production)
- **Purpose**: The live environment serving your actual end-users. Stability, security, and reliability are strictly required.
- **Trigger**: Typically triggered manually, or automatically when a release tag (e.g., `v1.0.0`) is created/published after UAT sign-off.
- **What to do here**:
  - Deploy to the PROD EC2 instance(s).
  - Minimal testing during deployment (tests should have already passed in UAT).
  - Ideally, implement zero-downtime deployment strategies (like Blue-Green or Rolling deployments).
  - Run post-deployment health checks.

---

## Step-by-Step GitHub Actions Setup

### Step 1: AWS EC2 Prerequisites
For each environment (DEV, UAT, PROD), you need:
1. **EC2 Instances**: Provision separate EC2 instances (or different directories/ports on the same instance if you are trying to save costs temporarily).
2. **SSH Key / Access**: Create an SSH key pair (`.pem` file) for GitHub Actions to connect to your EC2 instances.
3. **Application Directory**: Ensure the target directory exists on each EC2 instance (e.g., `/var/www/my-app`).

### Step 2: Configure GitHub Repository Secrets
To keep your server details secure, use GitHub Secrets.
Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
Add the following secrets:
- `EC2_SSH_KEY`: The private SSH key used to access your instances.
- `DEV_HOST`: Public IP or DNS of the DEV EC2 instance.
- `DEV_USERNAME`: SSH username (e.g., `ubuntu`, `ec2-user`).
- `UAT_HOST`: Public IP or DNS of the UAT EC2.
- `UAT_USERNAME`: SSH username for UAT.
- `PROD_HOST`: Public IP or DNS of the PROD EC2.
- `PROD_USERNAME`: SSH username for PROD.

*(Best Practice: You can use **GitHub Environments** to scope and protect these secrets per environment).*

### Step 3: Create GitHub Actions Workflows
In your VS Code, create a `.github/workflows` directory in your project root. You will create three `.yml` files, one for each environment. *Note: The deployment steps below use Node.js as an example, but can be adapted for Python, Java, Docker, etc.*

#### 1. `dev-deploy.yml`
```yaml
name: Deploy to DEV

on:
  push:
    branches:
      - dev

jobs:
  deploy-dev:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Environment
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies and Build
        run: |
          npm install
          npm run build

      - name: Copy files to DEV EC2
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.DEV_HOST }}
          username: ${{ secrets.DEV_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          source: "."
          target: "/var/www/dev-app"

      - name: Restart App on DEV EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEV_HOST }}
          username: ${{ secrets.DEV_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /var/www/dev-app
            npm install --production
            pm2 restart dev-app || pm2 start npm --name "dev-app" -- start
```

#### 2. `uat-deploy.yml`
```yaml
name: Deploy to UAT

on:
  pull_request:
    branches:
      - main

jobs:
  deploy-uat:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Environment
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies and Build
        run: |
          npm install
          npm run build

      - name: Copy files to UAT EC2
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.UAT_HOST }}
          username: ${{ secrets.UAT_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          source: "."
          target: "/var/www/uat-app"

      - name: Restart App on UAT EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.UAT_HOST }}
          username: ${{ secrets.UAT_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /var/www/uat-app
            pm2 restart uat-app || pm2 start npm --name "uat-app" -- start
```

#### 3. `prod-deploy.yml`
```yaml
name: Deploy to PROD

on:
  release:
    types: [published]
  # Or use workflow_dispatch for manual trigger button in GitHub UI
  workflow_dispatch:

jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    environment: production # Uses GitHub Environments for added protection (e.g. required reviewers)
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Environment
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies and Build
        run: |
          npm install
          npm run build

      - name: Copy files to PROD EC2
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          source: "."
          target: "/var/www/prod-app"

      - name: Restart App on PROD EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /var/www/prod-app
            pm2 restart prod-app || pm2 start npm --name "prod-app" -- start
```

### Step 4: Pushing from VS Code
1. Once you have created these files in your local VS Code, stage them: `git add .github/workflows/`
2. Commit the changes: `git commit -m "Add CI/CD pipelines for DEV, UAT, PROD"`
3. Push to your GitHub repository: `git push origin YOUR_BRANCH_NAME`
4. Go to your GitHub repository in the browser, click the **Actions** tab, and you will see your workflows ready to run based on the triggers you defined.

---

## What To Do With Your Deployed API (`/docs`)

Once your deployment is successful, you will often see an interactive API documentation page (like Swagger UI) at an address such as `http://ec2-xx-xx-xxx-xxx.compute.amazonaws.com:8000/docs#/`. This means your application is successfully running on the server and is accessible to the outside world!

Here is how you and your team should use this page across your three environments:

### 1) In the DEV Environment
*   **Share with Frontend/Mobile Developers**: This is the live "contract." Frontend developers use the DEV `/docs` page to understand exactly what endpoints exist, what JSON payload to send, and what responses they will get back.
*   **Manual Sandbox Testing**: You can click the **"Try it out"** button on any endpoint directly in your browser to test if the code you just wrote actually works on a real Linux server (and connects to the DEV database correctly), not just on your local laptop.
*   **Verify CI/CD**: Every time you push code to your `dev` branch in VS Code, the GitHub Action updates the EC2 server, and this `/docs` page will automatically refresh with your newest endpoints within minutes.

### 2) In the UAT Environment
*   **Share with QA and Clients**: Give this specific UAT URL to your Quality Assurance (QA) team, product managers, or clients. They will use it to test edge cases, verify bugs are actually fixed, and ensure the application behaves expectedly. 
*   **Automated Testing Contracts**: This environment serves as the stable target for automated end-to-end integration tests and load tests.
*   **The "Sign-off"**: Once the QA team confirms everything on the UAT `/docs` page (and any frontend connected to it) works perfectly, they approve the feature to be pushed to PROD.

### 3) In the PROD Environment
*   **Live Application**: This is the underlying API that your actual, real-world users (or production web app) are talking to.
*   **Security Precaution**: Best practice dictates that you **disable or hide** the `/docs` page in the PROD environment for security reasons. Random people on the internet should not easily discover how your backend API is structured. (In frameworks like FastAPI, you can disable docs based on the `NODE_ENV` or `ENVIRONMENT` variable).
*   **Third-Party Integrations**: If you are building a public-facing API (like Stripe or an open data endpoint), this `/docs` page is exactly what you share with other companies so their developers know how to integrate with your live service.

---

## How to use your specific API Endpoints from the `/docs` page

The Swagger UI (`/docs` page) is an interactive sandbox. Here is a step-by-step guide on how to actually use the endpoints you see, which represent standard "CRUD" (Create, Read, Update, Delete) operations.

### Understanding the Interface
For every endpoint listed on the page, there is a **"Try it out"** button in the top right corner of its expanded view. Clicking this button unlocks the input fields so you can send real requests to your server. 

### 1. `GET /` (Read Root)
*   **What it does:** This is usually a simple test endpoint that says "Hello World" or confirms the environment you are running in.
*   **How to use:** Click on the endpoint to expand it -> Click **"Try it out"** -> Click the big blue **"Execute"** button -> Scroll down to see the "Server response" section to view what your code returned (usually JSON).

### 2. `GET /health` (Health Check)
*   **What it does:** Used by AWS load balancers, deployment pipelines, or monitoring tools to ensure your application hasn't crashed. It should ideally just return a `200 OK` status very quickly.
*   **How to use:** Same as `GET /`. Expand -> **Try it out** -> **Execute**. You should see a success status code.

### 3. `POST /items/` (Create Item)
*   **What it does:** This endpoint specifically creates *new* data in your database (e.g., adding a new product, a new user, etc.).
*   **How to use:** 
    1. Expand the endpoint and click **"Try it out"**.
    2. You will see a `Request body` box filled with a generic JSON placeholder.
    3. Modify that JSON to reflect the data you want to save. For example, if it expects `{"name": "string", "price": 0}`, change it to `{"name": "Laptop", "price": 1200}`.
    4. Click **"Execute"**. The server should return the exact item it just saved to the database (often including a generated ID).

### 4. `GET /items/` (Read all items)
*   **What it does:** Fetches a list of all items currently saved in your database.
*   **How to use:** Expand -> **Try it out** -> **Execute**. The response body should contain the item you just created in step 3 (and any other items previously created).

### 5. `GET /items/{item_id}` (Read specific item)
*   **What it does:** Fetches only one specific item based on its ID.
*   **How to use:** 
    1. Expand the endpoint and click **"Try it out"**.
    2. You will see an input box specifically for `item_id`.
    3. Type in the ID of the item you created in step 3. 
    4. Click **"Execute"** to retrieve just that single item's details.

### 6. `PUT /items/{item_id}` (Update item)
*   **What it does:** Modifies an *existing* item in your database.
*   **How to use:**
    1. Expand the endpoint and click **"Try it out"**.
    2. Enter the `item_id` you want to modify in the ID box.
    3. In the `Request body` box, enter the completely updated JSON object. For example, change the price: `{"name": "Laptop", "price": 1000}`.
    4. Click **"Execute"**. The server should reply showing the updated item data.

### 7. `DELETE /items/{item_id}` (Delete item)
*   **What it does:** Permanently removes an item from your database.
*   **How to use:** 
    1. Expand the endpoint and click **"Try it out"**.
    2. Enter the exact `item_id` you wish to remove.
    3. Click **"Execute"**. 
    4. *To verify it worked:* Go back to `GET /items/{item_id}`, execute it with that same ID, and you should now see a `404 Not Found` error, proving the item was successfully deleted.

---

## Real World Concrete Example: Why did we build this API?

It is completely normal to think, *"Okay, I clicked the button and saw some JSON data... but what is the point?"*

The `/docs` page is **not** meant for regular users. It is a control panel specifically built for **developers**. Your API (this backend server running on EC2) is essentially the **"brain"** or **database manager**. 

To make this useful to a normal person, **Yes, you need another app (a Frontend).** 

Think of your favorite applications (Netflix, Instagram, Amazon). They all have two halves:
1. **The Frontend (The Face):** The website you click on (built with React/Angular) or the mobile app you download on your iPhone. 
2. **The Backend API (The Brain):** The server running on AWS that holds all the data. **This is what you just built!**

### Concrete Example: Building an Inventory App

Imagine you are building an Inventory Management website for a shoe store. 

#### 1. The Frontend App (What the user sees)
You write a completely separate application using **React** or **Vue.js**, and you host it at `www.myshoestore-inventory.com`. This app has beautiful buttons, tables, and login screens.

#### 2. How it talks to your API (What happens in the background)
When a store employee uses your React website to do their job, the website secretly uses the exact endpoints you just tested on the `/docs` page over the internet:

*   **Viewing the Inventory:** 
    The employee opens the website and sees a table of all shoes. 
    *Behind the scenes:* The React app secretly sent a request to your EC2 server: `GET http://ec2-...compute.amazonaws.com:8000/items/`. Your API replied with a giant list of JSON shoe data, which the React app then formatted into a pretty HTML table for the employee to read.
*   **Adding new inventory:** 
    The employee clicks an "Add New Shoe" button on the website, types "Nike Air Max" and "$120" into a form, and clicks Submit.
    *Behind the scenes:* The React app instantly sends a request to your EC2 server: `POST http://ec2-.../items/` with the body `{"name": "Nike Air Max", "price": 120}`. Your API saves this new shoe to the database forever.
*   **Fixing a mistake:** 
    The employee realizes the price is actually $130, so they click "Edit" on the website.
    *Behind the scenes:* React sends `PUT http://ec2-.../items/1` with `{price: 130}`. 

### Summary
The `/docs` page is just proof that your **"Brain"** is working. 

**Your next logical step as a developer** is to create a User Interface (like a React website, an iOS App, or an Android App) that acts as the **"Face"**. That interface will make HTTP requests (using tools like `fetch` or `axios` in Javascript) to your EC2 API URLs to actually read and write the data gracefully for your real users.

---

## Choosing Your Frontend: React Web vs. iOS vs. Android

Now that your API (Backend) is running on EC2, you get to decide what the "Face" of your application will be. Any of these choices can talk to the exact same AWS endpoints you just made!

Here is the difference between them to help you choose what to build next:

### 1) React (Web Application)
*   **What it is:** A website. Users open Google Chrome, Safari, or Edge and type in your URL (e.g., `www.mycoolapp.com`).
*   **How you build it:** You code in **JavaScript / TypeScript**, HTML, and CSS using the React framework.
*   **Pros:** 
    *   **Universal:** It works instantly on every device (Laptops, iPhones, Androids) as long as they have a web browser.
    *   **No App Stores:** You don't have to pay Apple or Google, and users don't have to download anything.
    *   **Fast Iteration:** When you fix a bug, users see it immediately upon refreshing the page.
*   **Cons:** Limited access to deep hardware features (like advanced Bluetooth or background GPS).

### 2) iOS (Apple App Store)
*   **What it is:** A native mobile app specifically for iPhones and iPads. Users download it from the Apple App Store.
*   **How you build it:** You code in **Swift** using Xcode (which requires an Apple Mac computer).
*   **Pros:** 
    *   **Premium Experience:** Feels incredibly smooth and fast on Apple devices. 
    *   **Hardware:** Full access to iPhone cameras, FaceID, ARKit, and push notifications.
*   **Cons:** 
    *   Only works on Apple devices. You completely ignore Android users.
    *   You have to pay Apple $99/year and go through their strict review process to publish it.

### 3) Android (Google Play Store)
*   **What it is:** A native mobile app for Android phones (Samsung, Google Pixel, etc.). Users download it from the Google Play Store.
*   **How you build it:** You code in **Kotlin** or **Java** using Android Studio.
*   **Pros:** 
    *   **Massive Audience:** Android has the largest global market share of smartphones.
    *   **Open:** Easier and cheaper ($25 one-time fee) to publish apps compared to Apple.
*   **Cons:** 
    *   Only works on Android devices. You completely ignore iPhone users.
    *   Harder to design because there are thousands of different screen sizes and phone brands.

### The "Cheat Code": Cross-Platform (React Native / Flutter)
If you want an app in **both** the Apple App Store and Google Play Store but don't want to write two completely different codebases (Swift *and* Kotlin), you can use a cross-platform framework.
*   **React Native:** You write it in JavaScript (very similar to a React Website) and it generates an app for *both* iOS and Android at the same time.

### Recommendation: Which should you pick?
*   If your app requires heavy typing, spreadsheets, or is mainly used on computers: **Choose React (Web)**.
*   If your app is just an idea and you want to launch it to the whole world as fast as possible: **Choose React (Web)**.
*   If your app relies heavily on taking photos, scanning QR codes, or sending push notifications to people's pockets: **Choose React Native (iOS + Android combined)**.
