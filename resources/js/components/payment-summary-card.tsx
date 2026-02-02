import { CreditCard, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Application, Payment } from '@/types';

type Props = {
    application: Application;
    payments?: Payment[];
    className?: string;
};

const getPaymentStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };

    return colorMap[status] || colorMap.pending;
};

export default function PaymentSummaryCard({
    application,
    payments = [],
    className,
}: Props) {
    const totalFee = parseFloat(application.total_fee);
    const amountPaid = parseFloat(application.amount_paid);
    const remainingBalance = totalFee - amountPaid;

    return (
        <Card className={cn(className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="size-5" />
                    Payment Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Fee</span>
                        <span className="font-medium">
                            ₱{totalFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount Paid</span>
                        <span className="font-medium text-green-600">
                            ₱{amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="font-medium">Remaining Balance</span>
                        <span className={cn('font-bold', remainingBalance > 0 ? 'text-red-600' : 'text-green-600')}>
                            ₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {application.is_paid && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Fully Paid
                    </Badge>
                )}

                {payments && payments.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <CreditCard className="size-4" />
                                Payment History
                            </h4>
                            <div className="space-y-2">
                                {payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between rounded-lg border p-3 text-sm"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    ₱{parseFloat(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <Badge className={getPaymentStatusColor(payment.payment_status)}>
                                                    {payment.payment_status}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {payment.payment_method}
                                                {payment.payment_reference && ` • ${payment.payment_reference}`}
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {payment.payment_date
                                                ? new Date(payment.payment_date).toLocaleDateString()
                                                : 'Pending'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

