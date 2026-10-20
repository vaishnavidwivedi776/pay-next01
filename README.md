# PayPulse – Next.js + TypeScript + Node.js
Attendance, Leave & Payroll Management System (from the SOW).

    npm install
    npm run dev      # open http://localhost:3000

Demo logins: admin/admin123 · hr/hr123 · emp/emp123

- Frontend: React (Next.js App Router) + TypeScript  → app/, components/
- Backend: Node.js API routes → app/api/[res]/route.ts
- Business logic (attendance summary, leave balance, payroll) → lib/calc.ts
- Data: JSON file at data/db.json (auto-created). Swap lib/db.ts for Prisma + MySQL/Postgres when you are ready.
- Reset data: delete the data/ folder.
Note: login cookie is demo-grade. Use NextAuth/JWT + hashed passwords before real use.
