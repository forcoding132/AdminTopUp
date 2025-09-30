import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/sidebar";
import { History as HistoryIcon, Download, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { type Transaction } from "@shared/schema";

export default function History() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchUID, setSearchUID] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const itemsPerPage = 10;

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ["/api/transactions", currentPage, itemsPerPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await fetch(`/api/transactions?limit=${itemsPerPage}&offset=${offset}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const formatTimestamp = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const totalPages = Math.ceil((transactionsData?.total || 0) / itemsPerPage);

  const handleExportCSV = () => {
    if (!transactionsData?.transactions) return;
    
    const headers = ["Timestamp", "User UID", "PUBG UC", "Pool Coins", "Admin User", "Status"];
    const csvContent = [
      headers.join(","),
      ...transactionsData.transactions.map((transaction: Transaction) => [
        formatTimestamp(transaction.createdAt),
        transaction.userUID,
        transaction.ucAmount || 0,
        transaction.coinsAmount || 0,
        transaction.adminUsername,
        transaction.status,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 min-h-screen p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Transaction History</h1>
          <p className="text-muted-foreground">Complete audit trail of all currency distributions</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="searchUID" className="text-sm font-medium text-foreground">
                  User UID
                </Label>
                <Input
                  id="searchUID"
                  type="text"
                  placeholder="Search by UID"
                  value={searchUID}
                  onChange={(e) => setSearchUID(e.target.value)}
                  data-testid="input-search-uid"
                />
              </div>
              <div>
                <Label htmlFor="dateFrom" className="text-sm font-medium text-foreground">
                  Date From
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  data-testid="input-date-from"
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-sm font-medium text-foreground">
                  Date To
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  data-testid="input-date-to"
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full" data-testid="button-apply-filters">
                  <Search className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <HistoryIcon className="text-primary mr-3 h-6 w-6" />
                All Transactions
              </CardTitle>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground" data-testid="text-showing-count">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, transactionsData?.total || 0)} of {transactionsData?.total || 0} transactions
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={!transactionsData?.transactions?.length}
                  data-testid="button-export-csv"
                >
                  <Download className="mr-1 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Timestamp
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">User UID</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">PUBG UC</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Pool Coins</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Admin User</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                          Loading transactions...
                        </div>
                      </td>
                    </tr>
                  ) : transactionsData?.transactions?.length > 0 ? (
                    transactionsData.transactions.map((transaction: Transaction) => (
                      <tr key={transaction.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-transaction-${transaction.id}`}>
                        <td className="py-4 px-6 text-sm text-foreground" data-testid={`text-timestamp-${transaction.id}`}>
                          {formatTimestamp(transaction.createdAt)}
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-foreground" data-testid={`text-uid-${transaction.id}`}>
                          {transaction.userUID}
                        </td>
                        <td className="py-4 px-6 text-sm text-foreground" data-testid={`text-uc-${transaction.id}`}>
                          {transaction.ucAmount > 0 ? transaction.ucAmount.toLocaleString() : "-"}
                        </td>
                        <td className="py-4 px-6 text-sm text-foreground" data-testid={`text-coins-${transaction.id}`}>
                          {transaction.coinsAmount > 0 ? transaction.coinsAmount.toLocaleString() : "-"}
                        </td>
                        <td className="py-4 px-6 text-sm text-muted-foreground" data-testid={`text-admin-${transaction.id}`}>
                          {transaction.adminUsername}
                        </td>
                        <td className="py-4 px-6" data-testid={`status-${transaction.id}`}>
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            Completed
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground" data-testid="text-no-transactions">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-previous-page"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-2">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          data-testid={`button-page-${pageNum}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-3 py-2 text-sm text-muted-foreground">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          data-testid={`button-page-${totalPages}`}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
