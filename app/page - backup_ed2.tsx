"use client";

import { useState } from "react";

type Expense = {
  id: number;
  title: string;
  amount: string;
  payer: string;
  participants: string[];
  category: string;
};

export default function Home() {
  const [members, setMembers] = useState<string[]>(["Amy", "Ben", "Cindy"]);
  const [newMember, setNewMember] = useState("");
  const [editingMemberName, setEditingMemberName] = useState<string | null>(null);

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePayer, setExpensePayer] = useState("Amy");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [expenseParticipants, setExpenseParticipants] =
    useState<string[]>(members);

  const [expenses, setExpenses] = useState<Expense[]>([
    { 
      id: 1, 
      title: 'Lunch', 
      amount: '450', 
      payer: 'Amy', 
      participants: ["Amy", 'Ben','Cindy'],
      category: 'Food'},
    { 
      id: 2, 
      title: 'Taxi', 
      amount: '300', 
      payer: 'Ben', 
      participants: ["Amy", 'Ben','Cindy'],
      category: 'Transport'
    },
    { 
      id: 3, 
      title: 'Dinner', 
      amount: '380', 
      payer: 'Ben', 
      participants: ["Amy", 'Ben','Cindy'],
      category: 'Food'}
      
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

const balanceByMember = members.map((member) => {
  const paid = expenses
    .filter((expense) => expense.payer === member)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const shouldPay = expenses.reduce((sum, expense) => {
    if (expense.participants.includes(member)) {
      return (
        sum +
        Number(expense.amount) / expense.participants.length
      );
    }

    return sum;
  }, 0);

  return {
    name: member,
    paid,
    shouldPay,
    balance: paid - shouldPay,
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

    if (editingMemberName !== null) {
      if (
        members.includes(trimmedName) &&
        trimmedName !== editingMemberName
      ) {
        alert("This member already exists.");
        return;
      }

      setMembers(
        members.map((member) =>
          member === editingMemberName ? trimmedName : member
        )
      );

      setExpenses(
        expenses.map((expense) => ({
          ...expense,
          payer:
            expense.payer === editingMemberName
              ? trimmedName
              : expense.payer,
          participants: expense.participants.map((participant) =>
            participant === editingMemberName ? trimmedName : participant
          ),
        }))
      );

      if (expensePayer === editingMemberName) {
        setExpensePayer(trimmedName);
      }

      setExpenseParticipants(
        expenseParticipants.map((participant) =>
          participant === editingMemberName ? trimmedName : participant
        )
     );

    setEditingMemberName(null);
    setNewMember("");
    return;
  }

  if (members.includes(trimmedName)) {
    alert("This member already exists.");
    return;
  }

  setMembers([...members, trimmedName]);
  setExpenseParticipants([...expenseParticipants, trimmedName]);
  setNewMember("");
};

  const handleEditMember = (memberName: string) => {
    setEditingMemberName(memberName);
    setNewMember(memberName);
  };

  const handleDeleteMember = (memberName: string) => {
    if (members.length <= 1) {
      alert("At least one member is required.");
      return;
    }

    setMembers(members.filter((member) => member !== memberName));

    setExpenses(
      expenses.map((expense) => ({
        ...expense,
        participants: expense.participants.filter(
          (participant) => participant !== memberName
        ),
    }))
  );

  if (expensePayer === memberName) {
    setExpensePayer(members.find((member) => member !== memberName) || "");
  }

  setExpenseParticipants(
    expenseParticipants.filter((member) => member !== memberName)
  );
};

  const handleAddExpense = () => {
    if (
      !expenseTitle.trim() ||
      !expenseAmount.trim() ||
      !expensePayer ||
      expenseParticipants.length === 0
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (editingExpenseId !== null) {
      setExpenses(
        expenses.map((expense) =>
          expense.id === editingExpenseId
            ? {
                ...expense,
                title: expenseTitle,
                amount: expenseAmount,
                payer: expensePayer,
                participants: expenseParticipants,
                category: expenseCategory,
              }
            : expense
      )
    );

    setEditingExpenseId(null);
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseParticipants(members);
    return;
  }

    const newExpense: Expense = {
      id: Date.now(),
      title: expenseTitle,
      amount: expenseAmount,
      payer: expensePayer,
      participants: expenseParticipants,
      category: expenseCategory,
    };

    setExpenses([...expenses, newExpense]);
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseParticipants(members);
  };

  const handleDeleteExpense = (id: number) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setExpenseTitle(expense.title);
    setExpenseAmount(expense.amount);
    setExpensePayer(expense.payer);
    setExpenseCategory(expense.category);
    setExpenseParticipants(expense.participants);
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
                {editingMemberName !== null ? "Update" : "Add"}
              </button>
            </div>

            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Members
              </h3>
              <ul className="space-y-2">
                {members.map((member) => (
                  <li
                    key={member}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                  >
                    <span>{member}</span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="rounded-xl bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600 hover:bg-sky-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="rounded-xl bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">Add Expense</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              >
                <option value="Food">🍽️ Food</option>
                <option value="Drink">🥤 Drink</option>
                <option value="Transport">🚕 Transport</option>
                <option value="Hotel">🏨 Hotel</option>
                <option value="Ticket">🎫 Ticket</option>
                <option value="Shopping">🛒 Shopping</option>
              </select>

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

            <div className="mt-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                 Split With
              </h3>

              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <label
                    key={member}
                    className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                  >
                  <input
                    type="checkbox"
                    checked={expenseParticipants.includes(member)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setExpenseParticipants([...expenseParticipants, member]);
                      } else {
                        setExpenseParticipants(
                          expenseParticipants.filter((name) => name !== member)
                        );
                      }
                    }}
                  />
                  {member}
                </label>
              ))}
            </div>
          </div>

            <button
              onClick={handleAddExpense}
              className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-700"
            >
              {editingExpenseId !== null ? "Update Expense" : "Add Expense"}
            </button>

            <div className="mt-8">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Expense List
              </h3>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-4 bg-slate-100 px-4 py-3 text-sm font-semibold">
                  <div>Title</div>
                  <div>Amount</div>
                  <div>Payer</div>
                  <div>Action</div>
                </div>

                {expenses.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    No expenses yet.
                  </div>
                ) : (
                  expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="grid grid-cols-4 items-center border-t border-slate-200 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{expense.title}</p>
                        <p className="text-xs text-slate-500">
                          {expense.category}
                        </p>
                      </div>
                      <div>${expense.amount}</div>
                      <div>{expense.payer}</div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-medium text-sky-600 hover:bg-sky-100"
                        >
                          Edit
                        </button>  

                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
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