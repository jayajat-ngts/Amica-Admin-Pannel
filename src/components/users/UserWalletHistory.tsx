import { useEffect, useState } from "react";
import { fetchUserWalletHistory } from "../../api/users";

type WalletTransaction = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  balance: number;
  timestamp: string;
  reference?: string;
};

export default function UserWalletHistory({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWalletHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserWalletHistory(userId);
        
        // Transform API data to component format
        const transformedTransactions: WalletTransaction[] = data.map((txn) => {
          const isCredit = ["deposit", "contest_winnings", "bonus", "joining_bonus", "referral_bonus", "contest_refund"].includes(txn.type);
          
          // Generate human-readable description
          let description = "";
          switch (txn.type) {
            case "deposit":
              description = "Wallet Deposit";
              break;
            case "withdrawal":
              description = "Wallet Withdrawal";
              break;
            case "contest_entry":
              description = "Contest Entry Fee";
              break;
            case "contest_refund":
              description = "Contest Entry Refund";
              break;
            case "contest_winnings":
              description = "Contest Prize";
              break;
            case "bonus":
              description = "Bonus Credit";
              break;
            case "joining_bonus":
              description = "Welcome Bonus";
              break;
            case "referral":
              description = "Referral Transaction";
              break;
            case "referral_bonus":
              description = "Referral Bonus";
              break;
            default:
              description = String(txn.type).replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
          }
          
          return {
            id: txn.id,
            type: isCredit ? "credit" : "debit",
            amount: txn.amount,
            description,
            balance: txn.balanceAfter,
            timestamp: txn.createdAt,
            reference: txn.referenceId || undefined,
          };
        });
        
        setTransactions(transformedTransactions);
      } catch (err: any) {
        console.error("Failed to fetch wallet history:", err);
        setError(err.message || "Failed to load wallet history");
      } finally {
        setLoading(false);
      }
    };

    loadWalletHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-red-500 dark:text-red-400 text-lg">{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💰</div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No transactions yet</p>
      </div>
    );
  }

  const totalCredits = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-700 dark:text-green-400 mb-1">Total Credits</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            +{totalCredits.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-700 dark:text-red-400 mb-1">Total Debits</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            -{totalDebits.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
          <div className="text-sm text-violet-700 dark:text-violet-400 mb-1">Net Change</div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {totalCredits - totalDebits > 0 ? "+" : ""}
            {(totalCredits - totalDebits).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              {/* Left: Transaction Info */}
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "credit"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
                  }`}
                >
                  <span className="text-xl">
                    {transaction.type === "credit" ? "💰" : "💸"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {transaction.description}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>{new Date(transaction.timestamp).toLocaleString()}</span>
                    {transaction.reference && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-xs">Ref: {transaction.reference}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Amount and Balance */}
              <div className="text-right">
                <div
                  className={`text-lg font-bold ${
                    transaction.type === "credit"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {transaction.type === "credit" ? "+" : "-"}
                  {transaction.amount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Balance: {transaction.balance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Indicator */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Showing {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
