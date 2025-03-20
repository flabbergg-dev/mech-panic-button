"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Car, Bike, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/Modal/Modal";
import type { ServiceType } from "@prisma/client";
import { updateMechanicServices } from "@/app/actions/mechanic/update-mechanic-services";
import useMechanicId from "@/hooks/useMechanicId";

type Service = {
  id: string;
  name: string;
};

export function ServiceSelector() {
  const useMechanic = useMechanicId();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const serviceCategories: { id: string; name: ServiceType }[] = [
    { id: "1", name: "OIL_CHANGE" },
    { id: "2", name: "BRAKE_REPAIR" },
    { id: "3", name: "TIRE_SERVICE" },
    { id: "4", name: "ENGINE_REPAIR" },
    { id: "5", name: "DIAGNOSTIC" },
    { id: "6", name: "BATTERY_SERVICE" },
    { id: "7", name: "AC_SERVICE" },
    { id: "8", name: "GENERAL_MAINTENANCE" },
  ];

  const handleToggleService = (serviceId: string) => {
    setSelectedServices(
      (prev) =>
        prev.includes(serviceId)
          ? prev.filter((id) => id !== serviceId) // Remove the service if it's already selected
          : [...prev, serviceId] // Add the service if it's not selected
    );
  };

  const getSelectedCount = () => {
    return selectedServices.length;
  };

  const handleSubmit = async () => {
    try {
      // Map selected service IDs to their corresponding ServiceType values
      if (!useMechanic.mechanicId) return;

      const servicesOffered = selectedServices
        .map((serviceId) => {
          const service = serviceCategories.find((s) => s.id === serviceId);
          return service ? service.name : null;
        })
        .filter((service): service is ServiceType => service !== null); // Filter out null values

      await updateMechanicServices({
        mechanicId: useMechanic.mechanicId,
        servicesOffered, // Pass the mapped ServiceType array
      });
    } catch (error) {
      console.error("Failed to update mechanic services:", error);
    } finally {
      window.location.reload();
    }
  };

  return (
    
    <Modal dialogText="" buttonText="Pick your services" buttonActive={true}>
      <div className="flex flex-col items-center justify-center min-h-[600px] p-4">
        <div className="w-full mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Select Services</h2>
          <div className="bg-primary/10 px-3 py-1 rounded-full text-sm font-medium">
            {getSelectedCount()} selected
          </div>
        </div>

        <div className="relative w-full h-[500px] overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key="services"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute w-full h-full"
            >
              <Card className="w-full h-full overflow-hidden">
                <CardContent className="p-6 overflow-y-auto max-h-[350px]">
                  <div className="space-y-4">
                    {serviceCategories.map(({ id, name }) => (
                      <div key={id} className="flex items-center space-x-2">
                        <Checkbox
                          id={id}
                          checked={selectedServices.includes(id)}
                          onCheckedChange={() => handleToggleService(id)}
                        />
                        <Label
                          htmlFor={id}
                          className="flex-1 cursor-pointer py-2"
                        >
                          {name}
                        </Label>
                        {selectedServices.includes(id) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 w-full">
          <Button onClick={handleSubmit} className="w-full">
            Continue with {getSelectedCount()} services
          </Button>
        </div>
      </div>
    </Modal>
  );
}


  // = [
  //   {
  //     id: "cars",
  //     title: "Automotive Mechanics (Cars)",
  //     icon: <Car className="h-8 w-8" />,
  //     services: [
  //       { id: "car-1", name: "Diagnostic Services" },
  //       { id: "car-2", name: "Routine Maintenance" },
  //       { id: "car-3", name: "Brake Services" },
  //       { id: "car-4", name: "Engine Repairs" },
  //       { id: "car-5", name: "Transmission Services" },
  //       { id: "car-6", name: "Suspension and Steering" },
  //       { id: "car-7", name: "Electrical System Repairs" },
  //       { id: "car-8", name: "Exhaust System Repairs" },
  //       { id: "car-9", name: "Heating and Cooling Systems" },
  //       { id: "car-10", name: "Fuel System Repairs" },
  //       { id: "car-11", name: "Tire Services" },
  //       { id: "car-12", name: "Pre-Purchase Inspections" },
  //       { id: "car-13", name: "Customization and Upgrades" },
  //       { id: "car-14", name: "Emission Testing and Repairs" },
  //       { id: "car-15", name: "Hybrid and Electric Vehicle Services" },
  //     ],
  //   },
  //   {
  //     id: "motorcycles",
  //     title: "Motorcycle Mechanics",
  //     icon: <Bike className="h-8 w-8" />,
  //     services: [
  //       { id: "moto-1", name: "Engine Tune-Ups and Repairs" },
  //       { id: "moto-2", name: "Transmission and Clutch Repairs" },
  //       { id: "moto-3", name: "Brake System Services" },
  //       { id: "moto-4", name: "Suspension Adjustments and Repairs" },
  //       { id: "moto-5", name: "Electrical System Diagnostics and Repairs" },
  //       { id: "moto-6", name: "Tire Changes and Balancing" },
  //       { id: "moto-7", name: "Chain and Sprocket Maintenance" },
  //       { id: "moto-8", name: "Fuel System Cleaning and Repairs" },
  //       { id: "moto-9", name: "Exhaust System Repairs and Upgrades" },
  //       { id: "moto-10", name: "Customization and Performance Upgrades" },
  //     ],
  //   },
  //   {
  //     id: "trucks",
  //     title: "Truck Mechanics",
  //     icon: <Truck className="h-8 w-8" />,
  //     services: [
  //       { id: "truck-1", name: "Heavy-Duty Engine Repairs" },
  //       { id: "truck-2", name: "Transmission and Drivetrain Services" },
  //       { id: "truck-3", name: "Brake System Inspections and Repairs" },
  //       { id: "truck-4", name: "Suspension and Steering Repairs" },
  //       { id: "truck-5", name: "Electrical System Diagnostics" },
  //       { id: "truck-6", name: "Exhaust and Emission System Repairs" },
  //       { id: "truck-7", name: "Tire Services and Replacements" },
  //       { id: "truck-8", name: "Hydraulic System Repairs" },
  //       { id: "truck-9", name: "Trailer and Towing System Maintenance" },
  //       { id: "truck-10", name: "Preventive Maintenance for Fleet Vehicles" },
  //     ],
  //   },
  // ];