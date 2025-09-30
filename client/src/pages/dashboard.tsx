import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Sidebar from "@/components/sidebar";
import { Coins, Send, CheckCircle, Clock, Loader2 } from "lucide-react";
import { insertTransactionSchema, type InsertTransaction, type Transaction } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      userUID: "",
      ucAmount: 0,
      coinsAmount: 0,
    },
  });

  // Fetch recent transactions
  const { data: transactionsData } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions?limit=5", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const distributionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // Create success message
      let message = "Done — sent ";
      const parts = [];
      if (data.transaction.ucAmount > 0) {
        parts.push(`${data.transaction.ucAmount.toLocaleString()} UC`);
      }
      if (data.transaction.coinsAmount > 0) {
        parts.push(`${data.transaction.coinsAmount.toLocaleString()} coins`);
      }
      message += parts.join(" / ");
      message += ` to UID ${data.transaction.userUID}`;

      setSuccessMessage(message);
      setShowSuccess(true);
      
      toast({
        title: "Distribution successful",
        description: message,
      });

      // Clear form
      form.reset();

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    },
    onError: (error: Error) => {
      toast({
        title: "Distribution failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTransaction) => {
    distributionMutation.mutate(data);
  };

  const formatTimestamp = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 min-h-screen p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Currency Distribution</h1>
          <p className="text-muted-foreground">Distribute PUBG Mobile UC and 8 Ball Pool coins to users</p>
        </div>

        {/* Distribution Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coins className="text-primary mr-3 h-6 w-6" />
              New Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* User UID Input */}
              <div className="space-y-2">
                <Label htmlFor="userUID" className="text-sm font-medium text-foreground">
                  User UID *
                </Label>
                <Input
                  id="userUID"
                  type="text"
                  placeholder="Enter user UID (e.g., 1234567890)"
                  data-testid="input-user-uid"
                  {...form.register("userUID")}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the unique identifier of the user to receive the currency
                </p>
                {form.formState.errors.userUID && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.userUID.message}
                  </p>
                )}
              </div>

              {/* Currency Amounts Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* PUBG Mobile UC */}
                <div className="space-y-2">
                  <Label htmlFor="ucAmount" className="text-sm font-medium text-foreground flex items-center">
                    <div className="w-5 h-5 bg-orange-500 rounded mr-2 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">P</span>
                    </div>
                    PUBG Mobile UC
                  </Label>
                  <Input
                    id="ucAmount"
                    type="number"
                    min="0"
                    placeholder="0"
                    data-testid="input-uc-amount"
                    {...form.register("ucAmount", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    UC (Unknown Cash) amount to distribute
                  </p>
                  {form.formState.errors.ucAmount && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.ucAmount.message}
                    </p>
                  )}
                </div>

                {/* 8 Ball Pool Coins */}
                <div className="space-y-2">
                  <Label htmlFor="coinsAmount" className="text-sm font-medium text-foreground flex items-center">
                    <div className="w-5 h-5 bg-yellow-400 rounded-full mr-2 flex items-center justify-center">
                      <Coins className="text-yellow-800 h-3 w-3" />
                    </div>
                    8 Ball Pool Coins
                  </Label>
                  <Input
                    id="coinsAmount"
                    type="number"
                    min="0"
                    placeholder="0"
                    data-testid="input-coins-amount"
                    {...form.register("coinsAmount", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pool coins amount to distribute
                  </p>
                  {form.formState.errors.coinsAmount && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.coinsAmount.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Form-level validation errors */}
              {form.formState.errors.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={distributionMutation.isPending}
                  className="px-8"
                  data-testid="button-distribute"
                >
                  {distributionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Distributing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Distribute Currency
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Success Message */}
        {showSuccess && (
          <Alert className="mb-8 border-green-200 bg-green-50" data-testid="alert-success">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Distribution Successful</strong>
              <br />
              <span data-testid="text-success-message">{successMessage}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Transactions Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Clock className="text-primary mr-3 h-6 w-6" />
                Recent Transactions
              </CardTitle>
              <Button
                variant="link"
                className="text-primary hover:text-primary/80 p-0"
                onClick={() => setLocation("/history")}
                data-testid="link-view-all"
              >
                View All →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User UID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">UC Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Coins Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsData?.transactions?.length > 0 ? (
                    transactionsData.transactions.map((transaction: Transaction) => (
                      <tr key={transaction.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-transaction-${transaction.id}`}>
                        <td className="py-3 px-4 text-sm text-foreground" data-testid={`text-timestamp-${transaction.id}`}>
                          {formatTimestamp(transaction.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-foreground" data-testid={`text-uid-${transaction.id}`}>
                          {transaction.userUID}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground" data-testid={`text-uc-${transaction.id}`}>
                          {transaction.ucAmount > 0 ? `${transaction.ucAmount.toLocaleString()} UC` : "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground" data-testid={`text-coins-${transaction.id}`}>
                          {transaction.coinsAmount > 0 ? `${transaction.coinsAmount.toLocaleString()} Coins` : "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground" data-testid={`text-admin-${transaction.id}`}>
                          {transaction.adminUsername}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground" data-testid="text-no-transactions">
                        No transactions yet. Create your first distribution above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
