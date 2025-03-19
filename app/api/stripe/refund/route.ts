import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { OfferStatus, ServiceStatus } from '@prisma/client';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

// Email template with consistent branding
const getEmailTemplate = (content: string) => `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://mech-panicbutton.com/logo.png" alt="Mech Panic Logo" style="height: 60px;" />
    </div>
    ${content}
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
      <p>Thank you for using Mech Panic Button</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  </div>
`;

export async function POST(req: Request) {
  try {
    const { id, requestId, clientId, mechanicId } = await req.json();

    if (!id || !requestId || !clientId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const client = await prisma.user.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return new NextResponse("Client not found", { status: 404 });
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({ payment_intent: id });

    // Update service request status || reset
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        mechanicId: null,
        status: ServiceStatus.REQUESTED 
      }
    });

    // Find and update the service offer
    const serviceOffer = await prisma.serviceOffer.findFirst({
      where: { serviceRequestId: requestId }
    });

    if (serviceOffer) {
      await prisma.serviceOffer.update({
        where: { id: serviceOffer.id },
        data: { status: OfferStatus.REJECTED }
      });
    }

    // Send email notification to customer
    await resend.emails.send({
      from: 'notifications@mech-panicbutton.com',
      to: client.email,
      subject: 'Your Refund Has Been Processed',
      html: getEmailTemplate(`
        <h2 style="color: #333; margin-bottom: 20px;">Refund Confirmation</h2>
        <p>Your refund has been processed successfully.</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Refund Details</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;">
              <strong>Amount:</strong> ${refund.amount ? `$${(refund.amount / 100).toFixed(2)}` : 'Processing'}
            </li>
            <li style="margin: 10px 0;">
              <strong>Status:</strong> ${refund.status}
            </li>
            <li style="margin: 10px 0;">
              <strong>Reference:</strong> ${refund.id}
            </li>
          </ul>
        </div>
        <p style="color: #666; font-size: 14px;">The refund should appear in your account within 5-10 business days.</p>
      `)
    });

    // Also notify mechanic if available

      const mechanic = await prisma.mechanic.findUnique({
        where: { id: mechanicId },
        include: {
          user: true
        }
      });

      if (!mechanic || !mechanic.user.email) {
        return new NextResponse("Mechanic not found", { status: 404 });
      }
      

      await resend.emails.send({
        from: 'notifications@mech-panicbutton.com',
        to: mechanic.user.email,
        subject: 'Service Request Cancelled',
        html: getEmailTemplate(`
          <h2 style="color: #333; margin-bottom: 20px;">Service Request Cancelled</h2>
          <p>A service request has been cancelled by the customer.</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Request ID:</strong> ${requestId}</p>
            <p>The payment has been refunded to the customer.</p>
          </div>
          <p style="color: #666; font-size: 14px;">The service request has been cancelled and removed from your active requests.</p>
        `)
      });
      
    

    return NextResponse.json({
      refund: refund,
    });
  } catch (error) {
    console.error('An error occurred when processing refund:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
