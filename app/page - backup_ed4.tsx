"use client";

import { useEffect, useState } from "react";

type Expense = {
  id: number;
  title: string;
  amount: string;
  currency: string;
  payer: string;
  participants: string[];
  category: string;
};

export default function Home() {
  
  const [members, setMembers] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    const savedMembers = localStorage.getItem("split-app-members");

    if (!savedMembers) return [];

    const parsedMembers: unknown = JSON.parse(savedMembers);

    if (
      Array.isArray(parsedMembers) &&
      parsedMembers.every((member) => typeof member === "string")
    ) {
      return parsedMembers;
    }

    return [];
  });

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    TWD: 1,
    USD: 32,
    JPY: 0.22,
    EUR: 35,
  });

  const convertToTWD = (amount: string, currency: string) => {
  return Number(amount) * (exchangeRates[currency] || 1);
};

  const [activeTab, setActiveTab] = useState("expenses");
  const [newMember, setNewMember] = useState("");
  const [editingMemberName, setEditingMemberName] = useState<string | null>(null);

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePayer, setExpensePayer] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseCurrency, setExpenseCurrency] = useState("TWD");
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [expenseParticipants, setExpenseParticipants] =
    useState<string[]>([]);

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (typeof window === "undefined") return [];

    const savedExpenses = localStorage.getItem("split-app-expenses");

    if (!savedExpenses) return [];

    return JSON.parse(savedExpenses) as Expense[];
  });

const totalExpense = expenses.reduce(
  (sum, expense) => sum + convertToTWD(expense.amount, expense.currency),
  0
);

const categorySummary = expenses.reduce<Record<string, number>>(
  (summary, expense) => {
    const amountInTWD = convertToTWD(expense.amount, expense.currency);

    summary[expense.category] = (summary[expense.category] || 0) + amountInTWD;

    return summary;
  },
  {}
);

const settlementMembers =
  members.length > 0 ? members : ["Personal"];

const balanceByMember = settlementMembers.map((member) => {
  const paid = expenses
    .filter((expense) => expense.payer === member)
    .reduce(
      (sum, expense) => sum + convertToTWD(expense.amount, expense.currency),
      0
    );

  const shouldPay = expenses.reduce((sum, expense) => {
    if (expense.participants.includes(member)) {
      return (
        sum +
          convertToTWD(expense.amount, expense.currency) /
            expense.participants.length
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

  const updatedMembers = [...members, trimmedName];

  setMembers(updatedMembers);
  setExpenseParticipants([...expenseParticipants, trimmedName]);

  if (!expensePayer) {
    setExpensePayer(trimmedName);
  }

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
    const amountNumber = Number(expenseAmount);

    if (!expenseTitle.trim()) {
      alert("Please enter an expense title.");
      return;
    }

    if (!expenseAmount.trim() || Number.isNaN(amountNumber) || amountNumber <= 0) {
      alert("Please enter a valid amount.");
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
                currency: expenseCurrency,
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
      currency: expenseCurrency,
      payer: expensePayer || "Personal",
      participants:
        expenseParticipants.length > 0 ? expenseParticipants : ["Personal"],
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
    setExpenseCurrency(expense.currency);
    setExpensePayer(expense.payer);
    setExpenseCategory(expense.category);
    setExpenseParticipants(expense.participants);
  };

  const handleCancelEditExpense = () => {
    setEditingExpenseId(null);
    setExpenseTitle("");
    setExpenseAmount("");
    setExpensePayer(members[0] || "");
    setExpenseParticipants(members);
    setExpenseCategory("Food");
    setExpenseCurrency("TWD");
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "Food":
        return "bg-orange-100 text-orange-700";

      case "Transport":
        return "bg-sky-100 text-sky-700";

      case "Hotel":
        return "bg-violet-100 text-violet-700";

      case "Ticket":
        return "bg-emerald-100 text-emerald-700";

      case "Shopping":
        return "bg-pink-100 text-pink-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const handleClearExpenses = () => {
  const confirmed = window.confirm(
    "Are you sure you want to clear all expenses?"
  );

  if (!confirmed) return;

  setExpenses([]);
  localStorage.removeItem("split-app-expenses");
};

const handleClearAll = () => {
  const confirmed = window.confirm(
    "Are you sure you want to reset the app?"
  );

  if (!confirmed) return;

  setMembers([]);
  setExpenses([]);
  setExpenseParticipants([]);
  setExpenseCategory("Food");
  setExpenseCurrency("TWD");
  setExpensePayer("");

  localStorage.removeItem("split-app-members");
  localStorage.removeItem("split-app-expenses");
};

useEffect(() => {
  localStorage.setItem("split-app-members", JSON.stringify(members));
  localStorage.setItem("split-app-expenses", JSON.stringify(expenses));
}, [members, expenses]);

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
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleClearExpenses}
              className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-medium text-white transition hover:bg-amber-600"
            >
              Clear Expenses
            </button>

            <button
              onClick={handleClearAll}
              className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Reset App
            </button>
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-3 rounded-3xl bg-white p-3 shadow-sm">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`rounded-2xl px-5 py-3 text-sm font-medium transition ${
              activeTab === "expenses"
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Expenses
          </button>

          <button
            onClick={() => setActiveTab("summary")}
            className={`rounded-2xl px-5 py-3 text-sm font-medium transition ${
              activeTab === "summary"
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Summary
          </button>

          <button
            onClick={() => setActiveTab("rates")}
            className={`rounded-2xl px-5 py-3 text-sm font-medium transition ${
              activeTab === "rates"
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Exchange Rates
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`rounded-2xl px-5 py-3 text-sm font-medium transition ${
              activeTab === "settings"
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Settings
          </button>
        </div>

        {activeTab === "expenses" && (
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
              <h2 className="mb-4 text-xl font-semibold">
                {editingExpenseId !== null ? "Edit Expense" : "Add Expense"}
              </h2>

              {editingExpenseId !== null && (
                <p className="mb-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                  You are editing an existing expense. Click Update Expense to save changes.
                </p>
              )}

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
                  value={expenseCurrency}
                  onChange={(e) => setExpenseCurrency(e.target.value)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                >
                  <option value="TWD">🇹🇼 TWD</option>
                  <option value="JPY">🇯🇵 JPY</option>
                  <option value="USD">🇺🇸 USD</option>
                  <option value="EUR">🇪🇺 EUR</option>
                </select>

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

                {members.length === 0 && (
                  <p className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    No members yet. This expense will be saved as a personal expense.
                  </p>
                )}

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

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleAddExpense}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-700"
                >
                  {editingExpenseId !== null ? "Update Expense" : "Add Expense"}
                </button>

                {editingExpenseId !== null && (
                  <button
                    onClick={handleCancelEditExpense}
                    className="rounded-2xl bg-slate-200 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="mt-8">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Expense List
                </h3>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-4 bg-slate-100 px-4 py-3 text-sm font-semibold">
                    <div>Title</div>
                    <div>Amount</div>
                    <div>Payer / Split</div>
                    <div>Action</div>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
                        🧾
                      </div>
                      <p className="font-medium text-slate-700">No expenses yet</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Add your first expense to start tracking or splitting costs.
                      </p>
                    </div>
                  ) : (
                    expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="grid grid-cols-4 items-center border-t border-slate-200 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryStyle(
                              expense.category
                            )}`}
                          >
                            {expense.category}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {expense.amount} {expense.currency}
                          </p>
                          <p className="text-xs text-slate-500">
                            ≈ TWD {convertToTWD(expense.amount, expense.currency).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p>{expense.payer}</p>
                          <p className="text-xs text-slate-500">
                            Split: {expense.participants.join(", ")}
                          </p>
                        </div>

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
        )}

        {activeTab === "rates" && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Exchange Rates</h2>

            <p className="mb-4 text-sm text-slate-500">
              All expenses are converted to TWD for settlement. You can manually
              adjust exchange rates if needed.
            </p>

            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(exchangeRates).map(([currency, rate]) => (
                <div key={currency}>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    1 {currency} = TWD
                  </label>

                  <input
                    type="number"
                    value={rate}
                    disabled={currency === "TWD"}
                    onChange={(e) =>
                      setExchangeRates({
                        ...exchangeRates,
                        [currency]: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 disabled:bg-slate-100"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "summary" && (
          <>
            {expenses.length > 0 && (
              <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">Category Summary</h2>

                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(categorySummary).map(([category, total]) => (
                    <div
                      key={category}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryStyle(
                          category
                        )}`}
                      >
                        {category}
                      </span>

                      <p className="mt-3 text-2xl font-bold">
                        TWD {total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Settlement Summary</h2>

              {expenses.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                  Add expenses to see the settlement summary.
                </div>
              ) : (
                <>
                  <div className="mb-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Total Expense</p>
                    <p className="text-2xl font-bold">
                      TWD {totalExpense.toFixed(2)}
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
                          Paid TWD {member.paid.toFixed(2)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Balance: {member.balance >= 0 ? "+" : "-"} TWD{" "}
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
                              TWD {settlement.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}