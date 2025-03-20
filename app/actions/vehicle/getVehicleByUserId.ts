"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
export async function getVehicleByUserId({userId}: {userId: string}) {

    try {
        if (!userId) {
            throw new Error("Unauthorized")
        }
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                userId ,
            },
            select: {
            id: true,
            userId: true,
            model: true,
            year: true,
            licensePlate: true,
            }
        })
        if (!vehicle) {
        console.error("Vehicle not found:", userId)
        throw new Error("Vehicle not found")
        } else {
            return {
                vehicle,
            }
        }
    } catch (error) {
        console.error("Error in getVehicleByUserId:", error)
        return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch vehicle",
        }
    }
    }