import { FormEvent, useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { Mechanic as PrismaMechanic, ServiceStatus, ServiceType, Prisma, UserRole } from "@prisma/client";
import { getAvailableMechanicsListAction } from "@/app/actions/mechanic/get-available-mechanics-list.action";
import { getAllUsersAction } from "@/app/actions/user/get-all-users.action";
import { createServiceRequestAction } from "@/app/actions/serviceRequestAction";
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { MechanicCard } from "./MechanicCard";
import { MechanicSearch } from "../SearchComps/MechanicSearch";
import { UserData } from "@/types";

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
}

export const Booking = () => {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState("selectedMechanic");
  const [formData, setFormData] = useState<BookingFormData>({
    mechanic: null,
    selectedDate: null,
    name: user?.firstName || null,
    email: user?.emailAddresses[0]?.emailAddress || null,
  });
  const [loading, setLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [mechanicList, setMechanicList] = useState<ExtendedMechanic[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.firstName || null,
        email: user.emailAddresses[0]?.emailAddress || null,
      }));
    }
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (!user?.id) {
        throw new Error("Please sign in to make a booking");
      }
      if (!formData.mechanic || !formData.email || !formData.name || !formData.selectedDate) {
        throw new Error("Please fill in all required booking information");
      }

      const mechanicLocation = formData.mechanic.location;
      if (!mechanicLocation) {
        throw new Error("Mechanic location information is missing");
      }

      // Get the selected service from the form
      const selectedService = formData.mechanic.servicesOffered[0];
      if (!selectedService) {
        throw new Error("Please select a service");
      }

      const serviceRequest = await createServiceRequestAction({
        userId: user.id,
        location: {
          latitude: mechanicLocation.latitude,
          longitude: mechanicLocation.longitude,
        },
        serviceType: selectedService,
        status: ServiceStatus.BOOKED,
        mechanicId: formData.mechanic.id,
        startTime: formData.selectedDate
      });

      if (!serviceRequest.success) {
        throw new Error(serviceRequest.error || "Failed to create service request");
      }

      await handleBookingConfirmation();

      setIsConfirmed(true);
      toast({
        title: "Booking Confirmed",
        description: "Check your email for booking details.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to submit booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      if (isConfirmed) {
        setTimeout(() => {
          setSteps('finalState');
          setFormData({
            mechanic: null,
            selectedDate: null,
            name: null,
            email: null,
          });
          setIsOpen(false);
          setIsConfirmed(false);
        }, 3000);
      }
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

  useEffect(() => {
    const fetchAvailableMechanics = async () => {
      try {
        const userResponse = await getAllUsersAction();
        const response = await getAvailableMechanicsListAction();

        if (userResponse?.data && response?.mechanic) {
          // First, create a map of user data for quick lookup
          const userDataMap = new Map<string, UserData>(
            userResponse.data.map(user => {
              const subscriptionPlan = (() => {
                try {
                  return (user as any).subscription?.plan || null;
                } catch (error) {
                  console.warn(`Failed to get subscription plan for user ${user.id}:`, error);
                  return null;
                }
              })();

              return [user.id, {
                ...user,
                subscriptionPlan
              } as UserData];
            })
          );

          const filteredMechanics = response.mechanic
            .filter((m: any) => {
              const userData = userDataMap.get(m.userId);
            
              // Include mechanics who are either PRO subscribers or have the Mechanic role
              const isPro = userData?.subscriptionPlan?.toLowerCase() === 'pro';
              const isMechanic = userData?.role === 'Mechanic';
              
              if (!m.isAvailable) {
                return false;
              }
              
              if (!isPro && !isMechanic) {
                return false;
              }

              return true;
            })
            .map((m: any) => {
              const userData = userDataMap.get(m.userId);
              const isPro = userData?.subscriptionPlan?.toLowerCase() === 'pro';
              
              
              return {
                ...m,
                isAvailable: true,
                location: typeof m.location === 'string' ? null : m.location as MechanicLocation,
                serviceArea: typeof m.serviceArea === 'string' ? m.serviceArea : JSON.parse(m.serviceArea),
                servicesOffered: Array.isArray(m.servicesOffered) ? m.servicesOffered : [],
                user: userData?.firstName || "",
                rating: m.rating,
                subscriptionPlan: userData?.subscriptionPlan
              };
            });

          setMechanicList(filteredMechanics);
        }
      } catch (error) {
        console.error("Error fetching mechanics:", error);
        toast({
          title: "Error",
          description: "Failed to load available mechanics",
          variant: "destructive",
        });
      }
    };

    if (user) {
      fetchAvailableMechanics();
    }
  }, [user, toast]);

  const handleMechanicSelect = (mechanicId: string) => {
    const selectedMechanic = mechanicList.find(mechanic => mechanic.id === mechanicId);
    if (selectedMechanic) {
      setFormData({
        mechanic: selectedMechanic,
        selectedDate: formData.selectedDate,
        name: formData.name,
        email: formData.email,
      });
      setSteps("selectDateTime");
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
    <div className="md:h-full hidden md:flex items-end justify-center w-full z-20 p-4 pb-24">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        className="absolute"
      >
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div style={{ filter: "url(#goo)" }} className="w-full max-w-lg mx-auto">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={modalRef}
              className="min-h-[300px] max-h-[85vh] bg-primary text-primary-foreground fixed bottom-20 left-0 right-0 md:bottom-24 md:left-4 md:right-4 md:absolute md:w-[500px] rounded-t-3xl md:rounded-3xl overflow-auto scrollbar-hide -z-10 p-4 md:p-5 mx-auto touch-pan-y"
              variants={{
                initial: {
                  opacity: 0,
                  y: 100,
                },
                animate: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                  },
                },
                exit: {
                  opacity: 0,
                  y: 100,
                  transition: {
                    duration: 0.2,
                  },
                },
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 200 || velocity.y > 500) {
                  setIsOpen(false);
                }
              }}
            >
              <div className="w-full flex justify-center mb-2 md:hidden">
                <div className="w-10 h-1 bg-primary-foreground/20 rounded-full" />
              </div>
              <Tabs value={steps} onValueChange={setSteps} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="selectedMechanic"
                    disabled={
                      steps !== "selectedMechanic" && !formData.mechanic
                    }
                  >
                    Mechanic
                  </TabsTrigger>
                  <TabsTrigger
                    value="selectDateTime"
                    disabled={
                      !formData.mechanic ||
                      (steps !== "selectDateTime" && !formData.selectedDate)
                    }
                  >
                    Date & Service
                  </TabsTrigger>
                  <TabsTrigger
                    value="confirmBooking"
                    disabled={!formData.selectedDate || !steps}
                  >
                    Confirm Booking
                  </TabsTrigger>
                </TabsList>
                {/* Mechanic Cards and search */}
                <AnimatePresence>
                  <TabsContent value="selectedMechanic" className="mt-4">
                    <MechanicSearch
                      mechanicList={mechanicList}
                      onSelect={handleMechanicSelect}
                    />

                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      <div className="grid gap-4">
                        {mechanicList.map((mechanic, index) => (
                          <MechanicCard
                            index={index}
                            key={mechanic.id}
                            mechanic={mechanic}
                            formData={formData}
                            setFormData={(data) => {
                              setFormData({
                                mechanic: data.mechanic,
                                selectedDate: data.selectedDate,
                                name: data.name,
                                email: data.email,
                              });
                            }}
                            onSelect={handleMechanicSelect}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </AnimatePresence>
                {/* calendar comp */}
                <AnimatePresence>
                  <TabsContent value="selectDateTime" className="mt-4">
                    <motion.div
                      className="text-primary-foreground h-full w-full flex flex-col gap-6 md:gap-2"
                      initial={{ y: 0, opacity: 0 }}
                      animate={{
                        y: isConfirmed ? -400 : 0,
                        opacity: 1,
                      }}
                      exit={{ opacity: 0 }}
                    >
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
                      <Select>
                        <SelectTrigger
                          className="w-full"
                          disabled={!formData.mechanic}
                        >
                          <SelectValue placeholder="Pick service" />
                        </SelectTrigger>
                        <SelectContent className="select-container">
                          {formData.mechanic?.servicesOffered.map(
                            (service: ServiceType, index: number) => (
                              <SelectItem key={index} value={service}>
                                {service.replace(/_/g, ' ')}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => setSteps("confirmBooking")}>
                        Go to next step
                      </Button>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
                {/* user info */}
                <AnimatePresence>
                  <TabsContent value="confirmBooking" className="mt-4">
                    <motion.div
                      className="text-primary-foreground h-full w-full flex flex-col md:flex-row gap-6 md:gap-2 pb-safe"
                      initial={{ y: 0, opacity: 0 }}
                      animate={{
                        y: isConfirmed ? -400 : 0,
                        opacity: 1,
                      }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex flex-col gap-6 w-full">
                        <div>
                          <Button
                            variant={"outline"}
                            onClick={() => setSteps("selectDateTime")}
                          >
                            Previous step
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="bg-background rounded-xl p-2 h-12 w-12 md:h-14 md:w-14 flex items-center justify-center">
                            <img
                              src={user.imageUrl}
                              alt="Mechanic"
                              width={100}
                              height={100}
                              className="rounded-lg"
                            />
                          </div>
                          <h2 className="flex flex-col gap-1 text-sm md:text-base">
                            <span>
                              {format(
                                formData.selectedDate!,
                                "EEEE, MMMM d yyyy"
                              )}
                            </span>
                            <span className="text-muted-foreground">
                              {steps[0]}
                            </span>
                          </h2>
                        </div>
                      </div>
                      <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4 md:gap-5 w-full"
                      >
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="name"
                            className="font-medium text-primary-foreground/70 text-sm"
                          >
                            Your name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="firstName"
                            value={user.firstName || ""}
                            readOnly
                            required
                            disabled={loading}
                            className="h-12 md:h-14 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-2 px-4 text-sm md:text-base text-primary-foreground/70 outline-none border-background"
                          />
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <label
                            htmlFor="email"
                            className="font-medium text-primary-foreground/70 text-sm"
                          >
                            Your email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={user.emailAddresses[0]?.emailAddress || ""}
                            readOnly
                            required
                            disabled={loading}
                            className="h-12 md:h-14 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-2 px-4 text-sm md:text-base text-primary-foreground/70 outline-none border-background"
                          />
                        </div>
                        <motion.button
                          type="submit"
                          disabled={loading}
                          className="bg-background dark:text-white text-black flex items-center gap-2 justify-center px-4 h-12 md:h-14 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base mt-auto"
                          whileTap={{ scale: 0.98 }}
                        >
                          {loading && (
                            <Loader className="animate-spin h-4 w-4" />
                          )}
                          Book Now
                        </motion.button>
                      </form>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
                {/* Confirm component */}
                <AnimatePresence>
                  <TabsContent value="finalState" className="mt-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="h-full w-full black absolute top-0 left-0 flex flex-col gap-4 items-center justify-center p-4"
                    >
                      <CheckCircle2
                        className="text-primary-foreground h-12 w-12 md:h-16 md:w-16"
                        fill="white"
                        stroke="black"
                      />
                      <h1 className="text-primary-foreground font-bold flex flex-col text-center text-lg md:text-xl">
                        <span>Booking confirmed!</span>
                        <span>Looking forward to chatting!</span>
                      </h1>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-16 md:h-20 flex items-center justify-center fixed bottom-0 left-0 right-0 md:relative bg-background/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none">
          <div className="flex items-center justify-between bg-primary rounded-2xl mx-auto z-10 p-1 w-[calc(100%-2rem)] md:w-[500px] px-2.5">
            <motion.div
              animate={{ height: 42 }}
              className="bg-primary bg-black rounded-lg max-w-[42px] min-w-[42px] flex items-center justify-center"
            >
              <div className="h-3 rounded w-3 bg-white dark:bg-black rotate-45" />
            </motion.div>
            <motion.button
              className="bg-secondary text-black dark:text-white px-4 py-1.5 rounded-xl text-sm md:text-base font-medium"
              onClick={() => setIsOpen((prev) => !prev)}
              whileTap={{ scale: 0.98 }}
            >
              {isOpen ? "Close" : "Book a Mechanic"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
