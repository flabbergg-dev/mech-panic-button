"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getServiceHistory } from "@/app/actions/getServiceHistory"
import { ServiceStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { StripeAccountTxHistory } from "@/components/StripeComponents/StripeAccountTxHistory"

interface ServiceHistory {
  id: string
  customerName: string
  serviceDate: string
  serviceType: string
  amount: number
  status: ServiceStatus
}

export const MechanicHistory = () => {
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [viewTransactions, setViewTransactions] = useState(false)

  useEffect(() => {
    const fetchServiceHistory = async () => {
      try {
        const response = await getServiceHistory()
        setServiceHistory(response)
        setTotalEarnings(response.reduce((sum, service) =>
          service.status === 'COMPLETED' ? sum + service.amount : sum, 0
        ))
      } catch (error) {
        console.error('Error fetching service history:', error)
      }
    }

    fetchServiceHistory()
  }, [])

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-michroma-sans">
            Total Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-12 text-xl font-michroma-sans">
            <p>Service History</p>
            <div className="flex-grow">
              <Button onClick={() => setViewTransactions(!viewTransactions)}>
                {viewTransactions ? "Hide" : "View"} transactions
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!viewTransactions && (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {serviceHistory.map((service) => (
                <Card key={service.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{service.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.serviceType}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {service.serviceDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${service.amount.toFixed(2)}
                        </p>
                        <span
                          className={`text-sm ${
                            service.status === "COMPLETED"
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {service.status.charAt(0).toUpperCase() +
                            service.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          )}
          {viewTransactions && (
            <ScrollArea className="h-[400px] pr-4">
              <StripeAccountTxHistory />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
