
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, Banknote, Clock, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockTransactions = [
    { id: "txn_1", date: "June 15, 2024", type: "Payout", status: "Completed", amount: 125.50 },
    { id: "txn_2", date: "June 1, 2024", type: "Payout", status: "Completed", amount: 88.00 },
    { id: "txn_3", date: "May 20, 2024", type: "Sale", status: "Processing", amount: 25.00 },
    { id: "txn_4", date: "May 15, 2024", type: "Payout", status: "Completed", amount: 210.75 },
]

export default function FinancesPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <CircleDollarSign className="h-8 w-8" /> Finances
            </h1>

            <div className="grid gap-6 md:grid-cols-3 mb-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available for Payout</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$150.50</div>
                        <p className="text-xs text-muted-foreground">From recent sales</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">July 1, 2024</div>
                        <p className="text-xs text-muted-foreground">Payouts are processed automatically</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Manage Payouts</CardTitle>
                         <CardDescription>Connect your bank account to receive funds.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button disabled className="w-full">
                            Connect Stripe (Coming Soon) <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                        A history of your sales and payouts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell>
                                        <Badge variant={tx.type === "Payout" ? "secondary" : "default"}>{tx.type}</Badge>
                                    </TableCell>
                                    <TableCell>{tx.status}</TableCell>
                                    <TableCell className="text-right font-medium">${tx.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
