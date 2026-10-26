# 🥛 DairyBooks

### A smarter way to manage everyday dairy business operations.

DairyBooks is a web-based dairy business management application designed to help dairy distributors and suppliers manage customers, track purchases and sales, monitor inventory, maintain financial records, and generate business reports — all from one place.

🔗 **Live Application:** [dairybooks.vercel.app](https://dairybooks.vercel.app)

💻 **Source Code:** [GitHub Repository](https://github.com/shubhag1409/dairybooks)

---

## ✨ Features

### 📊 Dashboard
- Get an overview of your dairy business operations.
- Monitor products and customers.
- View monthly purchase and sales totals.
- Track estimated profit based on sales and product costs.
- Access frequently used modules directly.

### 📦 Product Management
- Maintain a product catalogue.
- Manage product pricing and selling prices.
- Configure product-specific quantity offers.

### 👥 Customer Management
- Maintain customer records for shops, hotels, and households.
- Store contact details and addresses.
- Manage customer information, including relevant business identification details.
- Edit or remove customer records.

### 🛒 Purchase Tracking
- Record purchases from suppliers or dairy companies.
- Maintain purchase records for business tracking.

### 🧾 Sales & Billing
- Record customer sales and product quantities.
- Calculate bill totals using product prices.
- Apply configured quantity-based offers.
- Review previous sales.
- Filter sales records by customer and date ranges.
- Track sales by day, week, month, or year.
- Automatically record inventory adjustments associated with sales.

### 🟩 Crate Management
- Track dairy crate movements.
- Manage the reconciliation of crates received and distributed.

### 📦 Inventory Management
- Monitor inventory adjustments.
- Track stock movements associated with business operations.

### 💰 Financial Management
- **Ledger:** Maintain and review business financial records.
- **Cash Tracking:** Keep track of cash-related transactions.
- **Expenses:** Record and manage business expenses.
- **Tagada:** Access the dedicated module for tracking outstanding customer payments and collections.

### 📈 Reports & Analytics
- View business records for reporting.
- Review purchase and sales information.
- Generate and export reports, including Excel-based reporting.

### 🔐 Authentication
- Authenticate users before accessing protected application pages.
- Maintain persistent authentication sessions through Supabase.

### 📱 Responsive Interface
- Use a responsive interface designed for desktop, tablet, and mobile screens.
- Access key business information through a centralized dashboard and navigation system.

---

## 🛠️ Tech Stack

DairyBooks is built using modern web technologies.

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| TypeScript | Type-safe application development |
| Vite | Development server and build tooling |
| Tailwind CSS | Styling and responsive layouts |
| shadcn/ui | Reusable UI components |
| Radix UI | Accessible interface primitives |
| Supabase | Database integration and authentication |
| React Router | Client-side navigation |
| TanStack React Query | Data-fetching infrastructure |
| Recharts | Data visualization |
| ExcelJS | Excel report generation |
| React Hook Form | Form management |
| Zod | Schema validation |
| Lucide React | Icons |
| Vitest | Testing infrastructure |
| Vercel | Live application hosting |

---

## 🚀 Getting Started

Follow these steps to run DairyBooks on your local machine.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) — a compatible version for Vite 5.
- npm, included with Node.js.
- A [Supabase](https://supabase.com/) project with the required database schema and authentication configuration.

### 1. Clone the repository

```bash
git clone https://github.com/shubhag1409/dairybooks.git
```

Navigate to the project directory:

```bash
cd dairybooks
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project's root directory.

Add your Supabase project credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the placeholder values with the corresponding values from your Supabase project.

**Important:** Never expose your Supabase service-role key or other private credentials in frontend code. Only use a publishable key intended for client-side applications, and configure appropriate database access policies.

### 4. Configure Supabase

Ensure your Supabase project has the database tables, relationships, authentication settings, and security policies required by the application.

The application uses Supabase for data operations involving customers, products, purchases, sales, inventory adjustments, and related business records.

Review the `supabase/` directory in the repository for the project's database configuration and available migration files.

### 5. Start the development server

```bash
npm run dev
```

Vite will display a local development URL in your terminal. Open that address in your browser to access the application.

### 6. Build for production

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 🧪 Testing & Code Quality

The project includes scripts for running tests and checking code quality.

### Run tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run lint checks

```bash
npm run lint
```

---

## 📁 Project Structure

The repository follows a component-based React application structure.

```text
dairybooks/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI and layout components
│   │   └── ui/             # Shared interface components
│   ├── integrations/
│   │   └── supabase/       # Supabase client and database types
│   ├── lib/                # Shared utilities and business helpers
│   ├── pages/
│   │   ├── Auth.tsx        # Authentication
│   │   ├── Dashboard.tsx   # Business overview
│   │   ├── Products.tsx    # Product management
│   │   ├── Customers.tsx   # Customer management
│   │   ├── Purchases.tsx   # Purchase tracking
│   │   ├── Sales.tsx       # Sales and billing
│   │   ├── Crates.tsx      # Crate management
│   │   ├── Ledger.tsx      # Ledger
│   │   ├── CashTracking.tsx# Cash tracking
│   │   ├── Expenses.tsx    # Expense management
│   │   ├── Inventory.tsx   # Inventory management
│   │   ├── Tagada.tsx      # Outstanding payments
│   │   ├── Reports.tsx     # Business reports
│   │   └── Settings.tsx    # Application settings
│   ├── App.tsx             # Application routes
│   └── main.tsx            # Application entry point
├── supabase/               # Supabase-related project files
├── .gitignore
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

*Note: This is a high-level overview of the repository. Some supporting files and subdirectories are omitted for readability.*

---

## 🌐 Deployment

DairyBooks can be deployed as a web application using Vercel or another hosting platform that supports Vite applications.

### Deployment steps

1. Fork or import the repository into your Git provider.
2. Connect the repository to your hosting platform.
3. Configure the required Supabase environment variables.
4. Ensure the Supabase database schema and security policies are configured correctly.
5. Set the build command to `npm run build`.
6. Set the output directory to `dist`.
7. Deploy the application.

After deployment, verify authentication, database access, sales calculations, inventory updates, and report generation.

---

## 🔒 Security Considerations

Because DairyBooks handles business and financial information, security is important.

- Keep private credentials out of source control.
- Use Supabase Row Level Security (RLS) to restrict access to the appropriate user's records.
- Validate permissions on the database side rather than relying only on frontend route protection.
- Review database policies before using the application with real customer or financial data.
- Avoid storing unnecessary sensitive customer information.
- Back up important business records regularly.

**Note:** Frontend authentication alone does not guarantee that database records are properly protected. Database permissions and security policies must be configured correctly.

---

## 🎯 Project Goals

DairyBooks aims to simplify day-to-day dairy business management by bringing essential operational workflows into one application.

The project focuses on:

- Reducing dependence on scattered manual records.
- Making customer sales and purchase tracking easier.
- Improving visibility into inventory and crate movements.
- Organizing financial records and outstanding payments.
- Making business reports easier to access and export.

---

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make your changes.
4. Test your changes and run the lint checks.
5. Commit your changes.

   ```bash
   git commit -m "Add your feature"
   ```

6. Push your branch and open a pull request.

For significant changes, consider opening an issue first to discuss the proposed implementation.

---

## 🗺️ Roadmap

Potential areas for future development include:

- Enhanced financial summaries and analytics.
- Improved inventory forecasting.
- More flexible report filters and exports.
- Additional usability improvements for mobile devices.
- Expanded testing and documentation.

These are potential improvements rather than a commitment to a specific release schedule.

---

## 👨‍💻 Author

**Shubham Agarwal**

- GitHub: [@shubhag1409](https://github.com/shubhag1409)
- Project: [DairyBooks](https://github.com/shubhag1409/dairybooks)
- Live Application: [dairybooks.vercel.app](https://dairybooks.vercel.app)

---

## 📄 License

No license is specified in this README. Check the repository for an existing license before reusing, modifying, or redistributing the project.

---

<p align="center">
  <strong>DairyBooks — Bringing dairy business operations together.</strong>
</p>
