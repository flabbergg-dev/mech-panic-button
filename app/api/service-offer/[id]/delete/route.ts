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
        console.log('Deleting service offer:', id, 'for user:', userId)
        
        if (!userId) {
            console.log('Unauthorized: No userId found')
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
            }
        })

        if (!serviceOffer) {
            return new NextResponse('Service offer not found', { status: 404 })
        }

        await prisma.serviceOffer.delete({
            where: {
                id: id,
            },
        })

        console.log('Service offer deleted:', id)

        return new NextResponse('Service offer deleted successfully', { status: 200 })
    } catch (error) {
        console.error('Error deleting service offer:', error)
        return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
    }
}
