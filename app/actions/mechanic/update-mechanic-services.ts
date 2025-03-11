"use server"

import { prisma } from "@/lib/prisma"
import { ServiceType } from "@prisma/client"

// type ServiceType =
//     | "Diagnostic Services"
//     | "Routine Maintenance"
//     | "Brake Services"
//     | "Engine Repairs"
//     | "Transmission Services"
//     | "Suspension and Steering"
//     | "Electrical System Repairs"
//     | "Exhaust System Repairs"
//     | "Heating and Cooling Systems"
//     | "Fuel System Repairs"
//     | "Tire Services"
//     | "Pre-Purchase Inspections"
//     | "Customization and Upgrades"
//     | "Emission Testing and Repairs"
//     | "Hybrid and Electric Vehicle Services"
//     | "Engine Tune-Ups and Repairs"
//     | "Transmission and Clutch Repairs"
//     | "Brake System Services"
//     | "Suspension Adjustments and Repairs"
//     | "Electrical System Diagnostics and Repairs"
//     | "Tire Changes and Balancing"
//     | "Chain and Sprocket Maintenance"
//     | "Fuel System Cleaning and Repairs"
//     | "Exhaust System Repairs and Upgrades"
//     | "Customization and Performance Upgrades"
//     | "Heavy-Duty Engine Repairs"
//     | "Transmission and Drivetrain Services"
//     | "Brake System Inspections and Repairs"
//     | "Suspension and Steering Repairs"
//     | "Electrical System Diagnostics"
//     | "Exhaust and Emission System Repairs"
//     | "Tire Services and Replacements"
//     | "Hydraulic System Repairs"
//     | "Trailer and Towing System Maintenance"
//     | "Preventive Maintenance for Fleet Vehicles"

interface UpdateUserCurrentServicesProps {
        mechanicId: string
        servicesOffered: ServiceType[]
}

export async function updateMechanicServices({ mechanicId, servicesOffered }: UpdateUserCurrentServicesProps) {
        try {
            const MechanicServices = await prisma.mechanic.update({
                    where: {
                            id: mechanicId,
                    },
                    data: {
                            servicesOffered: servicesOffered,
                    },
            })

            return {
                    success: true,
                    MechanicServices,
            }
        } catch (error) {
            console.error("Error in update mechanic Services action:", error)
            return {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update Mechanic Services",
            }
        }
}
