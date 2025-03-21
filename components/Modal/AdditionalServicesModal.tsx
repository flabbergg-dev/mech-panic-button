import { Loader2Icon } from 'lucide-react';
import React from 'react'
import { Modal } from './Modal';
import { cn } from "@/lib/utils";
import { handleSecondTransaction } from '@/app/actions/serviceOfferAction';
import { Input } from '../ui/input';

type AdditionalServicesModalProps = {
  serviceRequestId: string;
  isLoading: boolean;
};

export const AdditionalServicesModal = ({
    serviceRequestId,
    isLoading,
}: AdditionalServicesModalProps) => {
    const [location, setLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);

    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });
                },
                () => {
                    setLocation(null);
                }
            );
        } else {
            setLocation(null);
        }
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData(event.target as HTMLFormElement);
        const amount = formData.get("amount");
        const note = formData.get("note");

        if (amount) {
            await handleSecondTransaction(
              serviceRequestId,
              Number(amount),
              note?.toString()!,
              location!
            );
            // TODO: change to something more opti
            window.location.reload()
        }
    };

    return (
        <Modal
            dialogText="Create an additional service for the client"
            buttonText="Add additional service"
            className={cn("w-full", isLoading && "cursor-not-allowed opacity-50")}
            buttonActive={!isLoading}
            buttonClassName='w-[-webkit-fill-available] bg-secondary'
            side={"bottom"}
        >
            {isLoading ? (
                <div className="flex justify-center items-center">
                    <Loader2Icon className="animate-spin" />
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Amount
                        </label>
                        <Input
                            type="number"
                            name="amount"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Enter amount"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Note
                        </label>
                        <Input
                            type="text"
                            name="note"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Enter note"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};
