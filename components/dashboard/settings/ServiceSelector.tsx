"use client";

import type React from "react";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Car,
  Bike,
  Truck,
} from "lucide-react";
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

type ServiceCategory = {
  id: string;
  title: string;
  icon: React.ReactNode;
  services: Service[];
};

type Service = {
  id: string;
  name: string;
};

export function ServiceSelector() {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [selectedServices, setSelectedServices] = useState<
    Record<string, string[]>
  >({
    cars: [],
    motorcycles: [],
    trucks: [],
  });
  const [direction, setDirection] = useState(0);

  const serviceCategories: ServiceCategory[] = [
    {
      id: "cars",
      title: "Automotive Mechanics (Cars)",
      icon: <Car className="h-8 w-8" />,
      services: [
        { id: "car-1", name: "Diagnostic Services" },
        { id: "car-2", name: "Routine Maintenance" },
        { id: "car-3", name: "Brake Services" },
        { id: "car-4", name: "Engine Repairs" },
        { id: "car-5", name: "Transmission Services" },
        { id: "car-6", name: "Suspension and Steering" },
        { id: "car-7", name: "Electrical System Repairs" },
        { id: "car-8", name: "Exhaust System Repairs" },
        { id: "car-9", name: "Heating and Cooling Systems" },
        { id: "car-10", name: "Fuel System Repairs" },
        { id: "car-11", name: "Tire Services" },
        { id: "car-12", name: "Pre-Purchase Inspections" },
        { id: "car-13", name: "Customization and Upgrades" },
        { id: "car-14", name: "Emission Testing and Repairs" },
        { id: "car-15", name: "Hybrid and Electric Vehicle Services" },
      ],
    },
    {
      id: "motorcycles",
      title: "Motorcycle Mechanics",
      icon: <Bike className="h-8 w-8" />,
      services: [
        { id: "moto-1", name: "Engine Tune-Ups and Repairs" },
        { id: "moto-2", name: "Transmission and Clutch Repairs" },
        { id: "moto-3", name: "Brake System Services" },
        { id: "moto-4", name: "Suspension Adjustments and Repairs" },
        { id: "moto-5", name: "Electrical System Diagnostics and Repairs" },
        { id: "moto-6", name: "Tire Changes and Balancing" },
        { id: "moto-7", name: "Chain and Sprocket Maintenance" },
        { id: "moto-8", name: "Fuel System Cleaning and Repairs" },
        { id: "moto-9", name: "Exhaust System Repairs and Upgrades" },
        { id: "moto-10", name: "Customization and Performance Upgrades" },
      ],
    },
    {
      id: "trucks",
      title: "Truck Mechanics",
      icon: <Truck className="h-8 w-8" />,
      services: [
        { id: "truck-1", name: "Heavy-Duty Engine Repairs" },
        { id: "truck-2", name: "Transmission and Drivetrain Services" },
        { id: "truck-3", name: "Brake System Inspections and Repairs" },
        { id: "truck-4", name: "Suspension and Steering Repairs" },
        { id: "truck-5", name: "Electrical System Diagnostics" },
        { id: "truck-6", name: "Exhaust and Emission System Repairs" },
        { id: "truck-7", name: "Tire Services and Replacements" },
        { id: "truck-8", name: "Hydraulic System Repairs" },
        { id: "truck-9", name: "Trailer and Towing System Maintenance" },
        { id: "truck-10", name: "Preventive Maintenance for Fleet Vehicles" },
      ],
    },
  ];

  const currentCategory = serviceCategories[currentCategoryIndex];

  const handleToggleService = (serviceId: string) => {
    const categoryId = currentCategory.id;
    setSelectedServices((prev) => {
      const currentSelected = [...prev[categoryId]];
      const index = currentSelected.indexOf(serviceId);

      if (index === -1) {
        currentSelected.push(serviceId);
      } else {
        currentSelected.splice(index, 1);
      }

      return {
        ...prev,
        [categoryId]: currentSelected,
      };
    });
  };

  const handlePrevCategory = () => {
    if (currentCategoryIndex > 0) {
      setDirection(-1);
      setCurrentCategoryIndex((prev) => prev - 1);
    }
  };

  const handleNextCategory = () => {
    if (currentCategoryIndex < serviceCategories.length - 1) {
      setDirection(1);
      setCurrentCategoryIndex((prev) => prev + 1);
    }
  };

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
      };
    },
  };

  const getSelectedCount = () => {
    return Object.values(selectedServices).reduce(
      (total, services) => total + services.length,
      0
    );
  };

  return (
    <Modal dialogText="Select the services u could provide" buttonText="Pick your services" buttonActive={true}>
      <div className="flex flex-col items-center justify-center min-h-[600px] p-4">
        <div className="w-full mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Select Services</h2>
          <div className="bg-primary/10 px-3 py-1 rounded-full text-sm font-medium">
            {getSelectedCount()} selected
          </div>
        </div>

        <div className="relative w-full h-[500px] overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentCategoryIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute w-full h-full"
            >
              <Card className="w-full h-full overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center gap-3">
                    {currentCategory.icon}
                    <CardTitle>{currentCategory.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 overflow-y-auto max-h-[350px]">
                  <div className="space-y-4">
                    {currentCategory.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={service.id}
                          checked={selectedServices[
                            currentCategory.id
                          ].includes(service.id)}
                          onCheckedChange={() =>
                            handleToggleService(service.id)
                          }
                        />
                        <Label
                          htmlFor={service.id}
                          className="flex-1 cursor-pointer py-2"
                        >
                          {service.name}
                        </Label>
                        {selectedServices[currentCategory.id].includes(
                          service.id
                        ) && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/30 p-4">
                  <div className="flex items-center justify-between w-full">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevCategory}
                      disabled={currentCategoryIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {currentCategoryIndex + 1} of {serviceCategories.length}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextCategory}
                      disabled={
                        currentCategoryIndex === serviceCategories.length - 1
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 w-full">
          <Button className="w-full">
            Continue with {getSelectedCount()} services
          </Button>
        </div>
      </div>
    </Modal>
  );
}
