import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import axios from "axios";
import { restaurantService } from "../App";
import { BiUpload, BiMapPin } from "react-icons/bi";

interface props {
  fetchMyRestaurant: () => Promise<void>;
}

const AddRestaurant = ({ fetchMyRestaurant }: props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { loadingLocation, location } = useAppContext();

  const handleSubmit = async () => {
    if (!name || !description || !phone || !image || !location) {
      toast.error("Please fill all the fields");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("phone", phone);
    formData.append("file", image);
    formData.append("latitude", location?.latitude.toString() || "");
    formData.append("longitude", location?.longitude.toString() || "");
    formData.append("formattedAddress", location?.formattedAddress || "");
    try {
      setSubmitting(true);
      const { data } = await axios.post(
        `${restaurantService}/api/restaurant/new`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success("Restaurant added successfully");
      fetchMyRestaurant();
    } catch (error: any) {
      console.log(error);
      toast.error(
        "Problem in adding restaurant" +
          (error.response?.data?.message
            ? ": " + error.response.data.message
            : ""),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="mx-auto max-w-lg rounded-xl bg-white shadow-sm p-6 space-y-6">
        <h1 className="text-xl font-semibold ">Add Your Restaurant</h1>

        <input
          type="text"
          id="name"
          placeholder="Restaurant Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-2 border-gray-400 px-4 py-2 text-sm outline-none focus:border-[#E23774] focus:ring-[#E23774] "
        />
        <input
          type="number"
          id="phone"
          placeholder="Contact Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-2 border-gray-400 px-4 py-2 text-sm outline-none focus:border-[#E23774] focus:ring-[#E23774] "
        />

        <textarea
          rows={4}
          id="description"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-2 border-gray-400 px-4 py-2 text-sm outline-none focus:border-[#E23774] focus:ring-[#E23774] "
        />
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border-gray-400 p-4 text-sm hover:bg-gray-50">
          <BiUpload className="h-5 w-5 text-[#E23774] " />
          {image ? image.name : "Upload Restaurant Image"}
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>
        <div className="flex items-center gap-3  rounded-lg border border-2 border-gray-400 p-4">
          <BiMapPin className="h-5 w-5 text-[#E23774]" />
          <div className="text-sm text-gray-500">
            {loadingLocation
              ? "Loading location..."
              : location?.formattedAddress || "No location selected"}
          </div>
        </div>
        <button
          className="w-full rounded-lg py-3  text-center text-sm font-semibold text-white bg-[#E23774] hover:bg-[#d91f66] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Add Restaurant"}
        </button>
      </div>
    </div>
  );
};

export default AddRestaurant;
