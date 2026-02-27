import React, { useState, useEffect } from "react";

const App = () => {
   const [contacts, setContacts] = useState([]);
   const [message, setMessage] = useState("");
   const [loading, setLoading] = useState(false);
   const [formData, setFormData] = useState({
      email: "",
      phoneNumber: "",
   });

   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

   const fetchContacts = async () => {
      try {
         const response = await fetch(`${API_URL}/contacts`);
         if (!response.ok) {
            throw new Error("Failed to fetch contacts");
         }
         const data = await response.json();
         setContacts(data);
      } catch (error) {
         console.error("Error fetching contacts:", error);
      }
   };

   useEffect(() => {
      fetchContacts();
   }, []);

   const handleChange = (e) => {
      setFormData({
         ...formData,
         [e.target.name]: e.target.value,
      });
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage("");

      if (!formData.email && !formData.phoneNumber) {
         setMessage("Please enter either email or phone number");
         setLoading(false);
         return;
      }

      try {
         const response = await fetch(`${API_URL}/identify`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               email: formData.email || null,
               phoneNumber: formData.phoneNumber || null,
            }),
         });

         const data = await response.json();

         if (response.ok) {
            setMessage(
               `Success! Primary Contact ID: ${data.contact.primaryContactId}`,
            );
            fetchContacts(); // Refresh table
            setFormData({ email: "", phoneNumber: "" });
         } else {
            setMessage(data.error || "Error processing request");
         }
      } catch (error) {
         console.error("Error submitting form:", error);
         setMessage("Network error. Is the backend running?");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-gray-100 p-8 font-sans">
         <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
               BiteSpeed Identity Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Form Section */}
               <div className="md:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6">
                     <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
                        Identify Customer
                     </h2>
                     <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                           </label>
                           <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter email"
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                           </label>
                           <input
                              type="text"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter phone"
                           />
                        </div>

                        <button
                           type="submit"
                           disabled={loading}
                           className={`w-full py-2 px-4 rounded-md text-white font-medium transition duration-200 ${
                              loading
                                 ? "bg-gray-400 cursor-not-allowed"
                                 : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                           }`}
                        >
                           {loading ? "Processing..." : "Identify"}
                        </button>
                     </form>

                     {/* {message && (
                        <div
                           className={`mt-4 p-3 rounded-md text-sm ${
                              message.includes("Success")
                                 ? "bg-green-100 text-green-800 border border-green-200"
                                 : "bg-red-100 text-red-800 border border-red-200"
                           }`}
                        >
                           {message}
                        </div>
                     )} */}
                  </div>
               </div>

               {/* Table Section */}
               <div className="md:col-span-2">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                     <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-semibold text-gray-700">
                           Database Records
                        </h2>
                        <button
                           onClick={fetchContacts}
                           className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                           Refresh Data
                        </button>
                     </div>

                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                                 <th className="px-6 py-3 font-semibold">ID</th>
                                 <th className="px-6 py-3 font-semibold">
                                    Email
                                 </th>
                                 <th className="px-6 py-3 font-semibold">
                                    Phone
                                 </th>
                                 <th className="px-6 py-3 font-semibold">
                                    Prec
                                 </th>
                                 <th className="px-6 py-3 font-semibold">
                                    Linked ID
                                 </th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200 bg-white">
                              {contacts.length > 0 ? (
                                 contacts.map((contact) => (
                                    <tr
                                       key={contact.id}
                                       className="hover:bg-gray-50 transition duration-150"
                                    >
                                       <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                          {contact.id}
                                       </td>
                                       <td className="px-6 py-4 text-sm text-gray-500">
                                          {contact.email || (
                                             <span className="text-gray-300">
                                                -
                                             </span>
                                          )}
                                       </td>
                                       <td className="px-6 py-4 text-sm text-gray-500">
                                          {contact.phoneNumber || (
                                             <span className="text-gray-300">
                                                -
                                             </span>
                                          )}
                                       </td>
                                       <td className="px-6 py-4 text-sm">
                                          <span
                                             className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                contact.linkPrecedence ===
                                                "primary"
                                                   ? "bg-green-100 text-green-800"
                                                   : "bg-yellow-100 text-yellow-800"
                                             }`}
                                          >
                                             {contact.linkPrecedence}
                                          </span>
                                       </td>
                                       <td className="px-6 py-4 text-sm text-gray-500">
                                          {contact.linkedId || (
                                             <span className="text-gray-300">
                                                -
                                             </span>
                                          )}
                                       </td>
                                    </tr>
                                 ))
                              ) : (
                                 <tr>
                                    <td
                                       colSpan="5"
                                       className="px-6 py-8 text-center text-gray-500"
                                    >
                                       No records found.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default App;
