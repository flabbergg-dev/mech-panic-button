'use server'

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId } = await auth()
        
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        if (!id) {
            return new NextResponse('Service offer ID is required', { status: 400 })
        }

        const serviceOffer = await prisma.serviceOffer.findUnique({
            where: {
                id: id,
            },
            select: {
                id: true,
                status: true,
                mechanicId: true,
                createdAt: true,
                updatedAt: true,
                mechanic: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                stripeCustomerId: true
                            }
                        }
                    }
                }
            }
        })

        if (!serviceOffer) {
            return new NextResponse('Service offer not found', { status: 404 })
        }

        const updatedServiceOffer = await prisma.serviceOffer.update({
            where: {
                id: id,
            },
            data: {
                status: 'ACCEPTED',
                updatedAt: new Date(),
            },
        })

        return NextResponse.json(updatedServiceOffer)
    } catch (error) {
        console.error('Error accepting service offer:', error)
        return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
    }
}
