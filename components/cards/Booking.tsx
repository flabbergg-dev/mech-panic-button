import { FormEvent, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { Mechanic as PrismaMechanic, ServiceStatus, ServiceType, Prisma, Booking as PrismaBooking } from "@prisma/client";
import { getAvailableMechanicsListAction } from "@/app/actions/mechanic/get-available-mechanics-list.action";
import { useToast } from "@/hooks/use-toast";
import { sendBookingConfirmationEmail } from "@/utils/emailNotifications";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "../forms/dateTimePicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MechanicCard } from "./MechanicCard";
import { createBookingRequestAction } from "@/app/actions/booking/request/createBookingRequest";
import { getBookingRequestsByIdAction } from "@/app/actions/booking/request/getBookingRequestsByIdAction";

interface MechanicLocation extends Prisma.JsonObject {
  latitude: number;
  longitude: number;
}

interface ExtendedMechanic extends Omit<PrismaMechanic, 'location' | 'servicesOffered'> {
  isAvailable: boolean;
  location: MechanicLocation | null;
  serviceArea: string;
  servicesOffered: ServiceType[];
  user?: string;
  rating: number | null;
  subscriptionPlan?: string | null;
}

interface BookingFormData {
  mechanic: ExtendedMechanic | null;
  selectedDate: Date | null;
  name: string | null;
  email: string | null;
  serviceType?: ServiceType | string;
  description?: string;
}

export const Booking = () => {

  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [steps, setSteps] = useState("mechanics");
  const [formData, setFormData] = useState<BookingFormData>({
    mechanic: null,
    selectedDate: null,
    name: user?.firstName || null,
    email: user?.emailAddresses[0]?.emailAddress || null,
  });
  const [loading, setLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [mechanicList, setMechanicList] = useState<ExtendedMechanic[]>([]);
  const [userHasBooking, setUserHasBooking] = useState(false);
  const [bookingInfo, setBookingInfo] = useState<PrismaBooking | null>(null);
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.firstName || null,
        email: user.emailAddresses[0]?.emailAddress || null,
      }));
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.mechanic || !formData.selectedDate || !formData.serviceType) {
      toast({
        title: "Missing information",
        description: "Please select a mechanic, date, and service type",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Default location if mechanic's location is not available
      const location = formData.mechanic.location;
      
      const response = await createBookingRequestAction({
        mechanicId: formData.mechanic.id,
        serviceType: formData.serviceType as string,
        scheduledDate: formData.selectedDate,
        description: formData.description || "No additional details provided",
        location: location as MechanicLocation
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Your booking has been confirmed!",
        });
        
        setIsConfirmed(true);
        setSteps("mechanics");
        
        // Reset form data
        setFormData({
          mechanic: null,
          selectedDate: null,
          name: null,
          email: null,
          serviceType: undefined,
          description: undefined
        });

        await handleBookingConfirmation()
      } else {
        throw new Error(response.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingConfirmation = async () => {
    if (!formData.mechanic || !formData.selectedDate) {
      toast({
        title: "Error",
        description: "Please select a mechanic and appointment time",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await sendBookingConfirmationEmail({
        to: formData.email || user?.emailAddresses[0]?.emailAddress || '',
        subject: "Your Mech-Panic Button Booking Confirmation",
        message: `Thank you for booking with Mech-Panic Button! We're excited to help you with your vehicle needs.`,
        userName: formData.name || user?.firstName || '',
        mechanicName: formData.mechanic.user,
        bookingDate: formData.selectedDate,
        serviceType: formData.mechanic.servicesOffered.join(', '),
      });

      setIsConfirmed(true);
      toast({
        title: "Success",
        description: "Booking confirmation email sent successfully",
      });
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      toast({
        title: "Error",
        description: "Failed to send booking confirmation email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMechanics = async () => {
    try {
      setLoading(true);
      const response = await getAvailableMechanicsListAction();
      if (response?.mechanic) {
        // Map mechanics to include user data
        const mechanicsWithUserData = response.mechanic.map((mechanic: any) => {
          // Extract subscription plan from user data
          const subscriptionPlan = mechanic.user?.stripeSubscriptionPlan || null;
          
          return {
            ...mechanic,
            isAvailable: mechanic.isAvailable,
            location: typeof mechanic.location === 'string' ? null : mechanic.location,
            serviceArea: typeof mechanic.serviceArea === 'string' ? mechanic.serviceArea : JSON.stringify(mechanic.serviceArea),
            servicesOffered: Array.isArray(mechanic.servicesOffered) ? mechanic.servicesOffered : [],
            user: mechanic.user?.firstName || "",
            rating: mechanic.rating,
            subscriptionPlan: subscriptionPlan
          };
        });
        
        // Filter mechanics to only show those with PRO subscription
        const proMechanics = mechanicsWithUserData.filter((mechanic: any) => {
          return mechanic.isAvailable && 
                (mechanic.subscriptionPlan?.toLowerCase() === 'pro' || 
                 mechanic.user?.role === 'Mechanic');
        });
        
        setMechanicList(proMechanics.length > 0 ? proMechanics : mechanicsWithUserData);
        console.log("Available mechanics:", proMechanics);
      }
    } catch (error) {
      console.error("Error fetching mechanics:", error);
      toast({
        title: "Error",
        description: "Failed to load available mechanics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserBooking = async () => {

    if(!user?.id) {
      throw new Error("User ID is required");
    };
    
    try {
      setLoading(true);
      const response = await getBookingRequestsByIdAction(user?.id);
      if (response) {
        setUserHasBooking(true);
        setBookingInfo(response);
      }
    } catch (error) {
      console.error("Error fetching user booking:", error);
      toast({
        title: "Error",
        description: "Failed to load user booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAvailableMechanics();
    fetchUserBooking();
  }, [toast]);

  const handleMechanicSelect = (mechanicId: string) => {
    const selectedMechanic = mechanicList.find(mechanic => mechanic.id === mechanicId);
    if (selectedMechanic) {
      setFormData({
        mechanic: selectedMechanic,
        selectedDate: formData.selectedDate,
        name: formData.name,
        email: formData.email,
      });
      setSteps("date-time-pick");
    } else {
      console.error("Mechanic not found");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <Loader className="animate-spin h-6 w-6 mx-auto mb-2" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600">Please sign in to make a booking.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full z-20 p-4">
      {userHasBooking ? (
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h2 className="text-xl font-semibold mb-2">You have an active booking</h2>
            <p className="text-gray-600">Please complete your current booking before making a new one.</p>
            <div>
              <h1>{bookingInfo?.mechanicId}</h1>
              <p>
                {bookingInfo?.notes}
              </p>
              <p>
                {bookingInfo?.totalPrice}
              </p>
              <p>
                {bookingInfo?.status}
              </p>
              <p>
                {bookingInfo?.scheduledStart?.toISOString()}
              </p>
              <Button>
                Pay Mechanic for appointment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
      <Tabs value={steps} onValueChange={setSteps} className="w-full">
        <TabsList>
            <TabsTrigger value="mechanics" disabled={steps !== "mechanics" && !formData.mechanic}>Mechanics</TabsTrigger>
            <TabsTrigger value="date-time-pick" disabled={steps !== "date-time-pick" && !formData.selectedDate}>Date & Time</TabsTrigger>
            <TabsTrigger value="info" disabled={steps !== "info"}>Info</TabsTrigger>
        </TabsList>
        <TabsContent value="mechanics">
          {mechanicList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {mechanicList.map((mechanic) => (
                  <MechanicCard
                    key={mechanic.id}
                    mechanic={mechanic}
                    formData={formData}
                    setFormData={setFormData}
                    onSelect={handleMechanicSelect}
                  />
                ))}
              </div>
          )}
        </TabsContent>
        <TabsContent value="date-time-pick">
          <motion.div
            className="h-full w-full flex flex-col gap-6 md:gap-2"
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: isConfirmed ? -400 : 0,
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
          >
            <h3 className="text-lg font-medium mb-2">Select Date & Time</h3>
            <DateTimePicker
              value={formData.selectedDate || new Date()}
              onChange={(date) => {
                if (date) {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    selectedDate: date,
                  }));
                }
              }}
            />
            
            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-medium">Select Service</h3>
              <Select
                onValueChange={(value) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    serviceType: value,
                  }));
                }}
              >
                <SelectTrigger
                  className="w-full"
                  disabled={!formData.mechanic}
                >
                  <SelectValue placeholder="Pick service" />
                </SelectTrigger>
                <SelectContent>
                  {formData.mechanic?.servicesOffered.map(
                    (service: ServiceType, index: number) => (
                      <SelectItem key={index} value={service}>
                        {service.replace(/_/g, ' ')}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Additional Details</h3>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Describe your issue or any special requirements..."
                  value={formData.description || ''}
                  onChange={(e) => {
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      description: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>
            
            <Button 
              onClick={() => setSteps("info")}
              disabled={!formData.selectedDate || !formData.serviceType}
              className="mt-4"
            >
              Continue to Confirmation
            </Button>
          </motion.div>
        </TabsContent>
        <TabsContent value="info" className="mt-4">
          <motion.div
            className="h-full w-full flex flex-col gap-6 md:gap-2"
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: isConfirmed ? -400 : 0,
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col gap-4 w-full">
              <h3 className="text-lg font-medium">Booking Summary</h3>
              
              <div className="border rounded-lg p-4 space-y-3">
                {formData.mechanic && (
                  <div className="flex items-center gap-3">
                    <div className="font-medium min-w-24">Mechanic:</div>
                    <div>{formData.mechanic.user}</div>
                  </div>
                )}
                
                {formData.selectedDate && (
                  <div className="flex items-center gap-3">
                    <div className="font-medium min-w-24">Date & Time:</div>
                    <div>{format(formData.selectedDate, "EEEE, MMMM d yyyy 'at' h:mm a")}</div>
                  </div>
                )}
                
                {formData.serviceType && (
                  <div className="flex items-center gap-3">
                    <div className="font-medium min-w-24">Service:</div>
                    <div>{typeof formData.serviceType === 'string' ? formData.serviceType.replace(/_/g, ' ') : ''}</div>
                  </div>
                )}
                
                {formData.description && (
                  <div className="flex items-start gap-3">
                    <div className="font-medium min-w-24">Details:</div>
                    <div className="text-sm">{formData.description}</div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setSteps("date-time-pick")}
                >
                  Back
                </Button>
                
                <Button
                  type="submit"
                  disabled={loading}
                  onClick={(e) => handleSubmit(e as any)}
                  className="flex items-center gap-2"
                >
                  {loading && <Loader className="animate-spin h-4 w-4" />}
                  Confirm Booking
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};
