"use client";

import { useState } from "react";

type Expense = {
  id: number;
  title: string;
  amount: string;
  payer: string;
};

export default function Home() {
  const [members, setMembers] = useState<string[]>(["Amy", "Ben", "Cindy"]);
  const [newMember, setNewMember] = useState("");

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePayer, setExpensePayer] = useState("Amy");

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, title: "Lunch", amount: "450", payer: "Amy" },
    { id: 2, title: "Taxi", amount: "300", payer: "Ben" },
    { id: 3, title: "Dinner", amount: "380", payer: "Ben" },
  ]);

  const totalPaidByMember = members.map((member) => {
  const total = expenses
    .filter((expense) => expense.payer === member)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  return {
    name: member,
    total,
  };
});

const totalExpense = expenses.reduce(
  (sum, expense) => sum + Number(expense.amount),
  0
);

const averagePerPerson =
  members.length > 0 ? totalExpense / members.length : 0;

const balanceByMember = totalPaidByMember.map((member) => {
  return {
    name: member.name,
    paid: member.total,
    shouldPay: averagePerPerson,
    balance: member.total - averagePerPerson,
  };
});

const creditors = balanceByMember
  .filter((member) => member.balance > 0)
  .map((member) => ({
    name: member.name,
    amount: member.balance,
  }));

const debtors = balanceByMember
  .filter((member) => member.balance < 0)
  .map((member) => ({
    name: member.name,
    amount: Math.abs(member.balance),
  }));

const settlements: {
  from: string;
  to: string;
  amount: number;
}[] = [];

let debtorIndex = 0;
let creditorIndex = 0;

while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
  const debtor = debtors[debtorIndex];
  const creditor = creditors[creditorIndex];

  const amount = Math.min(debtor.amount, creditor.amount);

  settlements.push({
    from: debtor.name,
    to: creditor.name,
    amount,
  });

  debtor.amount -= amount;
  creditor.amount -= amount;

  if (debtor.amount < 0.01) debtorIndex++;
  if (creditor.amount < 0.01) creditorIndex++;
}

  const handleAddMember = () => {
    const trimmedName = newMember.trim();

    if (!trimmedName) return;
    if (members.includes(trimmedName)) {
      alert("This member already exists.");
      return;
    }

    setMembers([...members, trimmedName]);
    setNewMember("");
  };

  const handleAddExpense = () => {
    if (!expenseTitle.trim() || !expenseAmount.trim() || !expensePayer) {
      alert("Please fill in all fields.");
      return;
    }

    const newExpense: Expense = {
      id: Date.now(),
      title: expenseTitle,
      amount: expenseAmount,
      payer: expensePayer,
    };

    setExpenses([...expenses, newExpense]);
    setExpenseTitle("");
    setExpenseAmount("");
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 rounded-3xl bg-white p-8 shadow-sm">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-sky-600">
            TripSplit
          </p>
          <h1 className="text-4xl font-bold">Travel Expense Splitter</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            A simple web app to help friends split travel expenses clearly and
            quickly.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Add Member</h2>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter member name"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
              <button
                onClick={handleAddMember}
                className="rounded-2xl bg-sky-600 px-5 py-3 font-medium text-white transition hover:bg-sky-700"
              >
                Add
              </button>
            </div>

            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Members
              </h3>
              <ul className="space-y-2">
                {members.map((member, index) => (
                  <li
                    key={index}
                    className="rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                  >
                    {member}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">Add Expense</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="text"
                placeholder="Expense title"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />

              <input
                type="number"
                placeholder="Amount"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />

              <select
                value={expensePayer}
                onChange={(e) => setExpensePayer(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              >
                {members.map((member, index) => (
                  <option key={index} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddExpense}
              className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-700"
            >
              Add Expense
            </button>

            <div className="mt-8">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Expense List
              </h3>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-3 bg-slate-100 px-4 py-3 text-sm font-semibold">
                  <div>Title</div>
                  <div>Amount</div>
                  <div>Payer</div>
                </div>

                {expenses.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    No expenses yet.
                  </div>
                ) : (
                  expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="grid grid-cols-3 border-t border-slate-200 px-4 py-3 text-sm"
                    >
                      <div>{expense.title}</div>
                      <div>${expense.amount}</div>
                      <div>{expense.payer}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Settlement Summary</h2>
          <div className="mb-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Expense</p>
            <p className="text-2xl font-bold">${totalExpense}</p>
            <p className="mt-2 text-sm text-slate-500">
              Each person should pay ${averagePerPerson.toFixed(2)}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
             {balanceByMember.map((member) => (
            <div
              key={member.name}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm text-slate-500">{member.name}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                Paid ${member.paid}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Balance: {member.balance >= 0 ? "+" : "-"}$
                {Math.abs(member.balance).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Who Pays Whom
          </h3>

          {settlements.length === 0 ? (
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
              Everyone is settled up.
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((settlement, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"
                >
                  <span className="font-semibold text-slate-900">
                    {settlement.from}
                  </span>{" "}
                  should pay{" "}
                  <span className="font-semibold text-slate-900">
                    {settlement.to}
                  </span>{" "}
                  <span className="font-bold text-sky-700">
                    ${settlement.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        </section>
      </div>
    </main>
  );
}