import React from 'react'

export const BookingRequestDetails = ({
  mechanicId,
  requestId
}: {
  mechanicId: string
  requestId: string
}) => {
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Booking Request Details</h2>
      <form className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium mb-1">Customer ID</label>
            <input 
              type="text" 
              id="customerId" 
              className="w-full p-2 border rounded-md"
              defaultValue="cust_12345" 
              readOnly
            />
          </div>
          
          <div>
            <label htmlFor="mechanicId" className="block text-sm font-medium mb-1">Mechanic ID</label>
            <input 
              type="text" 
              id="mechanicId" 
              className="w-full p-2 border rounded-md"
              defaultValue={mechanicId} 
              readOnly
            />
          </div>
          
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium mb-1">Service ID</label>
            <input 
              type="text" 
              id="serviceId" 
              className="w-full p-2 border rounded-md"
              defaultValue="serv_78901" 
              readOnly
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
            <select id="status" className="w-full p-2 border rounded-md">
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="scheduledStart" className="block text-sm font-medium mb-1">Scheduled Start</label>
            <input 
              type="datetime-local" 
              id="scheduledStart" 
              className="w-full p-2 border rounded-md"
              defaultValue="2023-08-15T10:00" 
            />
          </div>
          
          <div>
            <label htmlFor="scheduledEnd" className="block text-sm font-medium mb-1">Scheduled End</label>
            <input 
              type="datetime-local" 
              id="scheduledEnd" 
              className="w-full p-2 border rounded-md"
              defaultValue="2023-08-15T12:00" 
            />
          </div>
          
          <div>
            <label htmlFor="totalPrice" className="block text-sm font-medium mb-1">Total Price ($)</label>
            <input 
              type="number" 
              id="totalPrice" 
              className="w-full p-2 border rounded-md"
              defaultValue="150.00" 
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="note" className="block text-sm font-medium mb-1">Note</label>
            <textarea 
              id="note" 
              rows={3} 
              className="w-full p-2 border rounded-md"
              defaultValue="Customer requested oil change and tire rotation." 
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div>Created: {new Date().toLocaleString()}</div>
          <div>Updated: {new Date().toLocaleString()}</div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button 
            type="button" 
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
